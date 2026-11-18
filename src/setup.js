/**
 * 最初に1回だけ実行する関数。
 * フォーム・スプレッドシート・自動実行の設定（トリガー）をまとめて作る。
 * 2回目以降に実行しても、作り直さずに既存のURLを表示するだけ。
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  const existingFormId = props.getProperty('FORM_ID');
  if (existingFormId) {
    const form = FormApp.openById(existingFormId);
    const ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    Logger.log('すでに作成済みです。\n回答用URL: %s\n編集用URL: %s\n台帳: %s',
      form.getPublishedUrl(), form.getEditUrl(), ss.getUrl());
    return;
  }

  // 1. フォームを作る
  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(CONFIG.FORM_DESCRIPTION)
    .setCollectEmail(false)
    .setConfirmationMessage('ありがとうございます！届いた中から毎週1つ選んで作ります。選ばれたら note・X で紹介しますね。');

  form.addTextItem().setTitle(Q.NICKNAME).setRequired(true);
  form.addParagraphTextItem().setTitle(Q.PROBLEM)
    .setHelpText('例：毎朝、問い合わせメールを1件ずつスプレッドシートに貼り付けていて30分かかる')
    .setRequired(true);
  form.addParagraphTextItem().setTitle(Q.CURRENT)
    .setHelpText('手作業の流れをざっくり書いてもらえると、作るときのヒントになります');
  form.addCheckboxItem().setTitle(Q.TOOLS)
    .setChoiceValues(['Googleスプレッドシート', 'Gmail', 'Googleカレンダー', 'Googleフォーム', 'Excel', 'Slack', 'Notion', 'LINE'])
    .showOtherOption(true);
  form.addTextItem().setTitle(Q.CONTACT);
  form.addCheckboxItem().setTitle(Q.CONSENT)
    .setChoiceValues(CONSENT_CHOICES)
    .setValidation(FormApp.createCheckboxValidation().requireSelectExactly(CONSENT_CHOICES.length).build())
    .setRequired(true);

  // 2. 回答を受け取るスプレッドシートを作ってつなぐ
  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_TITLE);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // 3. AIの判定結果を書く「依頼台帳」シートを用意
  const ledger = ss.insertSheet(CONFIG.LEDGER_SHEET_NAME, 0);
  ledger.getRange(1, 1, 1, CONFIG.LEDGER_HEADERS.length)
    .setValues([CONFIG.LEDGER_HEADERS])
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
  ledger.setFrozenRows(1);
  ledger.setColumnWidths(1, CONFIG.LEDGER_HEADERS.length, 140);
  ledger.setColumnWidth(3, 320);
  ledger.setColumnWidth(7, 280);
  // ステータス列はプルダウンで選べるようにする
  const statusCol = CONFIG.LEDGER_HEADERS.indexOf('ステータス') + 1;
  ledger.getRange(2, statusCol, 999, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['未確認', '候補', '制作中', '公開済み', '見送り']).build());
  // 空のシート1を消す
  const blank = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (blank) ss.deleteSheet(blank);

  // 4. フォームが送られたら onFormSubmit が動くようにする
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();

  props.setProperties({ FORM_ID: form.getId(), SPREADSHEET_ID: ss.getId() });

  Logger.log('作成しました！\n回答用URL: %s\n編集用URL: %s\n台帳: %s',
    form.getPublishedUrl(), form.getEditUrl(), ss.getUrl());
}
