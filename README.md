
# CS_Toku HomePage

# ToDo

## 全体

- [x] やっぱside-barつかう
- [x] サイドメニューのスタイル設定
- [x] Section・Tag名・カテゴリ名をバーに表示(パンくずリストっぽく)
- [x] mainをラップして中央配置・・？(タイルにする)
- [x] Summaryの処理
- [x] listのPagerの描画
- [x] taxonomyページの描画
- [x] descriptionの生成
  - [x] PostはSummaryを使う？
  - [x] SlideはTitleを使って `<meta name="nosnippets">` にする
  - [x] Topページだけ頑張って `config.yml` に書いて表示
- [x] 自動生成のページでのmetaタグはnoindexを設定
- [x] ogタグの再確認
- [x] 文書以外のページのog:imageの扱い
- [x] LinkのURLやLangに確認
- [x] Footerの処理(特にかんがえなかったｗ)
- [x] ページャーボタン修正
- [x] 条件でAMPのスクリプトをロードさせる
- [x] 各環境のconfigを作成
- [x] staging/masterのnetlifyの設定ファイルを作成
- [x] cssのminify設定
- [x] Google Analyticsの設定
- [x] Aboutページの作成
  - [x] 資格の項目を出すShortcodeの作成
  - [x] markdownのある程度のスタイル
  - [x] 各画像のsrcsetの用意
  - [x] SNSのリンク用意
  - [ ] Facebook用？のprofile用OGPを追加する
- [ ] JSON-LDの対応
- [ ] サイトのDescriptionを `config.yml` に書く

## Article

- [x] tableの描画
- [x] 画像破損分の直し(リンク切れ？)
- [x] amp-imgの使用(img用ショートコードの作成)
- [x] TOCの描画
- [x] レスポンシブにする
- [x] サムネの扱い
- [x] highlightの整形
- [x] tocの表示調整
- [x] html,cssのリファクタリング
  - メディアクエリ
  - articleのサイズやcard,singleでの扱い
- [x] 最小画面の設定(min-width)
- [x] ページャーボタンの配置(狭いとき)

### 優先度低め

- [ ] Tableの表示されない部分のScroll
- [ ] ampコンポーネントのショートコード作成
- [ ] pager.htmlの設定(リンクの設定とFooterへの追加)
- [x] 画像をクリックしたときにズームする仕組み

# Reference

- [Introduction | Search | Google Developers](https://developers.google.com/search/docs/guides/)
- [構造化データ テストツール](https://search.google.com/structured-data/testing-tool/u/0/)
- [JSON-LD 1.1](https://json-ld.org/spec/latest/json-ld/)
- [AMP ページにアナリティクスを追加する](https://developers.google.com/analytics/devguides/collection/amp-analytics/?hl=ja)
