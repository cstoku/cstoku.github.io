+++
date = "2015-12-23T02:05:50+09:00"
title = "Python3.5のType Hintについて"

description = ""

tags = [
    "Python3",
    "Type Hints"
]

categories = [
    "Python",
]
+++


この記事は[Python Advent Calendar 2015](http://www.adventar.org/calendars/846#list-2015-12-23)の23日目の記事です。

ちゃんとした記事をこのブログに書くのは今回が初です（笑）

早速、やってきまそ。


# Type Hintsについて書こうと思ったわけ

最近HaskellやScalaなどの関数型のパラダイムを持つ静的型付け言語を学ぶようになって型推論など面白いなーなど思っていたところに動的型付けのPythonで型についての提案が導入されたので気になった次第です。

動的型付け言語ですからてきと〜にプログラム書いてても通ってしまいます。まぁそこがいいとこでもあるのかもしれませんが、少し大きなライブラリや業務で使うとなるとバグ見つけたりするのに苦労しそうです。

そこでType Hintsがあれば！！！というわけで勉強がてら紹介です。


それと、記事投稿遅れてスイマセンm(_ _)m

# Type Hintsとは！

Type Hintsとは[PEP0484](https://www.python.org/dev/peps/pep-0484/)で提案された静的型解析などを行うための仕様を提案したものです。

ぶっちゃければ、関数の引数・戻り値などに型を指定して型チェックを行うための仕様を提案したもの。

## 目的は・・・

この提案の目的としては型アノテーションの標準化された構文の提供です。これにより、静的型解析やリファクタリングや実行時の型チェックなどなど、行えるようになります。

まぁ、主には静的型解析がやりたいそうです。

## 目的じゃないもの

この提案が取り込まれた暁にはPythonは静的型付け言語に・・・・！！

とはならないわけで。

依然として動的型付け言語ですし、Type Hintsを必須にすることは望んでないようです。

まぁ、自分は取っ付き易いとこがPythonの取り柄の一つだと思っているので、良い考えだと思います。


それでは本題に。


# 型定義の構文

``` python3
def func(name: str) -> str:
    return 'Hello ' + name
```

とまぁ、関数アノテーションを利用して型を指定してあげるだけです。簡単ですね。

型を参照したい場合は`__annotations__`属性として参照できます。

``` pycon
>>> func.__annotations__
{'name': <class 'str'>, 'return': <class 'str'>}
```

## 型の別名

変数に突っ込みましょう。注意するのが、変数名の先頭を大文字にしておくことです。
(ユーザー定義型として扱うので)

``` python3
Name = str

def func(name: Name) -> str:
    return 'Hello ' + name
```

## ジェネリクス

typingモジュールのTypeVarを使います。

``` python3
from typing import TypeVar

T = TypeVar('T')

def p(x: T) -> None:
    print(x)
```

TypeVarの第1引数は代入する変数名と同じでなければなりません。また、型変数を再定義してもいけません。

この場合の型変数Tは全ての型を受け付けます。こういう型をAny型としています。

(例えば、デフォルトの関数の引数と戻り値はAny型です。何でも受け取るし、何かしら返すから)

また、戻り値で指定している`None`は`type(None)`と等価です。

TypeVarは特定の型を指定することができます。

``` python3
from typing import TypeVar

T = TypeVar('T', str, bytes)

def p(x: T) -> None:
    print(x)
```


ちょっと複雑な使い方をこの規約の例から引用してみます。

``` python3
from typing import TypeVar, Iterable, Tuple

T = TypeVar('T', int, float, complex)
Vector = Iterable[Tuple[T, T]]

def inproduct(v: Vector) -> T:
    return sum(x*y for x, y in v)
```

この例ではint、float、complex型のペア(タプル)のオブジェクトを持つ、イテレート可能な型Vectorを定義していますね。

inproduct関数の引数として先ほど作成したVector型を受け取りT型(intかfloatかcomplex)を返すように記述されています。


### ユーザー定義のクラスでジェネリック

ジェネリック型としてユーザー定義のクラスを定義するためには`Generic`基底クラスを使います。

``` python3
from typing import TypeVar, Generic

T = TypeVar('T')
S = TypeVar('S')

class C(Generic[T, S]):
    pass
```

- 複数指定する場合はカンマで切って指定してください。
- 多重継承が使えます。
- メタクラスはサポートされていません。


## 呼び出し可能オブジェクト

defで作った関数とか、lambdaで作った関数とか、`__call__`が定義されているクラスのインスタンスとかとか？

そういうのを指すときの表現では`Callable`を使用します。

`Callable`は1つ目に引数のリスト、2つ目に戻り値を指定します。

``` python3
from typing import Callable

def async_query(on_success: Callable[[int], None],
                on_error: Callable[[int, Exception], None]) -> None:
    pass
```

引用してるので処理全然書いてませんが。

- `on_success`は引数にint型をとり、戻り値は無し
- `on_error`は引数にint型とException型をとり、戻り値は無し

という感じで表現できます。

`Callable`の1つ目の引数に空のリストを指定することで引数なしを表現することができます。

また、引数リストには省略記号を使用することができます。

``` python3
Func = Callable[..., str]
```


ここで注意しておくことが、キーワード引数を指定するための仕組みが今のところないことです。

省略記号を利用した場合はキーワード引数を使用することができます。


## コレクションの中の型指定

intなどの場合はそのまま指定すればいいですが、辞書とかリストの場合は中のデータの型を指定する必要があります。

``` python3
Vector = List[float]
NameDict = Dict[str, str]
NumSet = Set[int]
NumFSet = FrozenSet[int]
```

センスない例ですねぇ(笑)


## 上界の指定

`TypeVar`のキーワード引数`bound`を指定することで可能です。

``` python3
from typing import TypeVar

class Comparable(metaclass=ABCMeta):
    @abstractmethod
    def __lt__(self, other: Any) -> bool:
        ...

CT = TypeVar('CT', bound=Comparable)

def min(x: CT, y: CT) -> CT:
    if x < y:
        return x
    else:
        return y

```

また引用です。

要するに型変数CTはComparableのサブクラスである。という指定ができるということですね。

よってmin関数は引数に取れるのはComparableのサブクラスのオブジェクトのみになります。


## 共変性と反変性

共変性を指定するときは`covariant=True`を、反変性を指定するときは`contravariant=True`を`TypeVar`に渡します。

また例を引用・・・。

``` python3
from typing import TypeVar, Generic, Iterable, Iterator

T = TypeVar('T', covariant=True)

class ImmutableList(Generic[T]):
    def __init__(self, items: Iterable[T]) -> None:
        ...
    def __iter__(self) -> Iterator[T]:
        ...
    ...

class Employee:
    ...

class Manager(Employee):
    ...

def dump_employees(emps: ImmutableList[Employee]) -> None:
    ...
```

`dump_employees`関数の引数は`Employee`という型のリストとして指定されていますが、共変なので`Employee`のサブクラスである`Manager`をリストの中に含めることが可能です。


## 前方参照

型ヒントが定義されていない名前を含むときは文字列リテラルとして表すことができます。

木構造実装するときに自分自身を指定しますよね？あれです。

``` python3
class Tree:
    def __init__(self, left: Tree, right: Tree):
        self.left = left
        self.right = right
```

これだとTreeがまだ定義されていないためエラーになります。これを回避するため文字列リテラルで指定します。

``` python3
class Tree:
    def __init__(self, left: 'Tree', right: 'Tree'):
        self.left = left
        self.right = right
```

## 直和型

1つの引数に複数の型を受け取る可能性がある場合ですね。

``` python3
from typing import Union

class Employee:
    pass

def handle_employees(e: Union[Employee, Sequence[Employee]]) -> None:
    pass
```

これでEmployee型かEmployee型のオブジェクトを含むシーケンス型を取ることが出来ます。


# 型コメント

変数の型を明示的に指定する場合に使います。
``` python3
x = [] # type: List[Employee]
x, y, z = (1, 'a', 0.1) # type: (int, str, float)
```

`with`文と`for`文にも使用することが出来ます。



# 終わりに

なんか時間を取らなかったおかげでPEPに書いてあることマンマになっちゃいましたね(´・ω・｀)

思ったこととしては、静的な型付けをする言語とくらべてしまうとやはり面倒ですね。当たり前ですけど。
関数定義の部分がやったら長くなりそうですし。

ただ、その恩恵は大きそうで静的型チェックや補完などで上手く使えればとても効果的だとは思います。

それと、型について勉強不足ですね。読むのに少し苦労しましたし、ここから先の話を追っかけたり、上手く活用するためには勉強が必要そうです。。


これは日を改めてもう一度まとめてみたいな〜とか考えています。

　  
びみょ〜な感じですが終わりです！  
それでは、良いPythonライフを！！


