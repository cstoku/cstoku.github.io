
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
  - [x] Facebook用？のprofile用OGPを追加する
- [x] JSON-LDの対応
- [x] サイトのDescriptionを `config.yml` に書く
- [x] 404ページ作る
- [x] favicon.icoを作って設定
- [x] sitemap.xml
- [x] RSS
- [x] Feedlyのサムネが表示されない不具合の修正(諦め)
- [x] 言語切替ボタン実装
- [x] 404はインデックスしない用にする
- [x] taxonomyTermのキャピタライズ(humanize)
- [x] tagがキャピタライズされているのを直す(.Data.Term)
- [x] 画像を極力pageresourceに
  - [x] blog-thumb.jpgの処理(siteThumbnail)
  - [x] default.jpgの処理(default header)
  - [x] profile.jpgの処理
  - [x] faviconの処理
  - [x] site-logoの処理
- [x] 画像サイズの最適化
  - [x] ogpのサムネ
  - [x] JSON+LDの画像
  - [x] headerの画像
  - [x] profile画像
  - [x] favicon画像
  - [x] jpgにする？？ `find . -name '*.png' | xargs -I{} echo {} -quality 100 {} | sed s/png$/jpg/ | xargs -I{} sh -c "convert {}"`
- [x] 以前のドメインからのリダイレクト設定
- [x] wwwのドメインをメインのドメインへ飛ばすようにリダイレクト設定

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
- [x] なぜかsrcsetsに大量のURLが入ってしまうバグ

## Article

- [ ] タスク洗い出し

### 優先度低め

- [ ] Tableの表示されない部分のScroll
- [ ] ampコンポーネントのショートコード作成
- [ ] pager.htmlの設定(リンクの設定とFooterへの追加)
- [x] 画像をクリックしたときにズームする仕組み
- [ ] Aboutページの中身ふやす・・・
- [ ] DisqusがOfflineのときのfallback
- [ ] Fontを自ドメインから配信・最適化
- [ ] 多言語化用マルチドメインを考えてみる

# Reference

- [Introduction | Search | Google Developers](https://developers.google.com/search/docs/guides/)
- [構造化データ テストツール](https://search.google.com/structured-data/testing-tool/u/0/)
- [JSON-LD 1.1](https://json-ld.org/spec/latest/json-ld/)
- [AMP ページにアナリティクスを追加する](https://developers.google.com/analytics/devguides/collection/amp-analytics/?hl=ja)
- [Workbox | Google Developers](https://developers.google.com/web/tools/workbox/)
