---
title: Kubebuilderを使ってみる

date: 2018-12-20T00:00:00+09:00

tags:
- kubernetes
- kubebuilder
- custom-controller
- advent-calendar-2018

resources:
- name: thumbnail
  src: header.jpg

---

この記事は [Kubernetes Advent Calendar 2018](https://qiita.com/advent-calendar/2018/kubernetes) 20日目の記事です。

今回はkubebuilderで超絶簡単なカスタムコントローラを作る手順を紹介しようと思う。

# kubebuilderとは

[kubebuilder](https://github.com/kubernetes-sigs/kubebuilder)はGoでKubernetes APIを実装するためのSDKだ。

Railsなどのフレームワークの様に、kubebuilderも様々なリソースやファイルなどを自動的に生成し、開発を手助けしてくれる。

# kubebuilderのインストール

GithubのRleaseから取ってくる。

[Releases · kubernetes-sigs/kubebuilder](https://github.com/kubernetes-sigs/kubebuilder/releases)

ここから自分のOSのBinary選択して落としてきてパスの通ってるところにも配置しよう。

Linuxであればだいたい以下のようになるだろう。

```sh
version=1.0.5
arch=amd64

curl -L -O https://github.com/kubernetes-sigs/kubebuilder/releases/download/v${version}/kubebuilder_${version}_linux_${arch}.tar.gz
tar -zxvf kubebuilder_${version}_linux_${arch}.tar.gz
mkdir -p ~/.local/bin
mv kubebuilder_${version}_linux_${arch}/bin/* ~/.local/bin/
export PATH=$PATH:$HOME/.local/bin
```

tar.gzを展開すると分かるが、結構いろいろなバイナリを配置することになる。

```plain
kubebuilder_1.0.5_linux_amd64/bin/lient-gen
kubebuilder_1.0.5_linux_amd64/bin/onversion-gen
kubebuilder_1.0.5_linux_amd64/bin/eepcopy-gen
kubebuilder_1.0.5_linux_amd64/bin/efaulter-gen
kubebuilder_1.0.5_linux_amd64/bin/tcd
kubebuilder_1.0.5_linux_amd64/bin/en-apidocs
kubebuilder_1.0.5_linux_amd64/bin/nformer-gen
kubebuilder_1.0.5_linux_amd64/bin/ube-apiserver
kubebuilder_1.0.5_linux_amd64/bin/ubebuilder
kubebuilder_1.0.5_linux_amd64/bin/ube-controller-manager
kubebuilder_1.0.5_linux_amd64/bin/ubectl
kubebuilder_1.0.5_linux_amd64/bin/ister-gen
kubebuilder_1.0.5_linux_amd64/bin/penapi-gen
```

自分でちゃんと管理したい方は適宜配置する場所を変えるといいだろう。

あと、以下のものを適宜インストールしておく。このページを見に来るような方であれば入っていることだろう。

- [Go](https://golang.org/doc/install)
- [dep](https://golang.github.io/dep/docs/installation.html)

# kubebuilderの使う

## kubebuilderのプロジェクトの作成

さて、まずはプロジェクトの作成をする。

kubebuilderを実行するには `$GOPATH/src/<package>` 以下で作業を行う必要がある。

ここでは `$GOPATH/src/github.com/cstoku/kubebuilder-test-controller` で作業します。

`cstoku/kubebuilder-test-controller` 辺りは適宜変えて実行してください。

```sh
mkdir -p $GOPATH/src/github.com/cstoku/kubebuilder-test-controller
cd $GOPATH/src/github.com/cstoku/kubebuilder-test-controller
```

それではプロジェクトを作成しよう。 `kubebuilder init` で行う。

- `--domain` : APIグループのドメインを指定(割となんでも良い)
- `--license` : ソフトウェアライセンスを選択。 `apache2` か `none` の2択
- `--owner` : このソフトウェアのオーナーを指定。Copyrightに差し込んでくれる

```sh
kubebuilder init --domain cstoku.dev --license apache2 --owner cstoku
```

途中 `dep ensure` 実行するけどいい？と聞いてくるので `y` を選択して実行させよう。

以下のような出力があったはずだ。

```plain
Run `dep ensure` to fetch dependencies (Recommended) [y/n]?
y
dep ensure
Running make...
make
go generate ./pkg/... ./cmd/...
go fmt ./pkg/... ./cmd/...
go vet ./pkg/... ./cmd/...
go run vendor/sigs.k8s.io/controller-tools/cmd/controller-gen/main.go all
CRD manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/crds'
RBAC manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/rbac'
go test ./pkg/... ./cmd/... -coverprofile cover.out
?       github.com/cstoku/kubebuilder-test-controller/pkg/apis  [no test files]
?       github.com/cstoku/kubebuilder-test-controller/pkg/controller    [no test files]
?       github.com/cstoku/kubebuilder-test-controller/pkg/webhook       [no test files]
?       github.com/cstoku/kubebuilder-test-controller/cmd/manager       [no test files]
go build -o bin/manager github.com/cstoku/kubebuilder-test-controller/cmd/manager
Next: Define a resource with:
$ kubebuilder create api
```

さて、何が作成されたかだけ確認しておこう。

```plain
$ ls -a1
.
..
bin
cmd
config
cover.out
Dockerfile
.gitignore
Gopkg.lock
Gopkg.toml
hack
Makefile
pkg
PROJECT
vendor
```

## リソースの定義

さて、次は出力にもあった通りAPI作成してリソースの定義をしていく。

`kubebuilder create api` で行う。

- `--group` : APIグループを指定
- `--version` : APIのバージョンを指定。 [ここ](https://kubernetes.io/docs/concepts/overview/kubernetes-api/#api-versioning) を参考に付けると良いだろう
- `--kind` : APIの名前を指定

```sh
kubebuilder create api --group trial --version v1alpha1 --kind EchoField
```

今回は `--group` にお試し版ということもあって `trial` を指定。 `--version` に初期段階ということで `v1alpha1` を指定。 `--kind` は今回作成するリソース名( `EchoField` )を指定した。

実行するとリソースとコントローラを `pkg` 以下に作成していいか聞かれるので `y` をそれぞれ入力しよう。

以下のような出力があったはずだ。Testでこけているが一旦ここでは気にしない :stuck_out_tongue_closed_eyes:

```plain
Create Resource under pkg/apis [y/n]?
y
Create Controller under pkg/controller [y/n]?
y
Writing scaffold for you to edit...
pkg/apis/trial/v1alpha1/echofield_types.go
pkg/apis/trial/v1alpha1/echofield_types_test.go
pkg/controller/echofield/echofield_controller.go
pkg/controller/echofield/echofield_controller_test.go
Running make...
go generate ./pkg/... ./cmd/...
go fmt ./pkg/... ./cmd/...
go vet ./pkg/... ./cmd/...
go run vendor/sigs.k8s.io/controller-tools/cmd/controller-gen/main.go all
CRD manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/crds'
RBAC manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/rbac'
go test ./pkg/... ./cmd/... -coverprofile cover.out
?       github.com/cstoku/kubebuilder-test-controller/pkg/apis  [no test files]
?       github.com/cstoku/kubebuilder-test-controller/pkg/apis/trial    [no test files]
2018/12/21 01:45:51 failed to start the controlplane. retried 5 times
FAIL    github.com/cstoku/kubebuilder-test-controller/pkg/apis/trial/v1alpha1   0.013s
?       github.com/cstoku/kubebuilder-test-controller/pkg/controller    [no test files]
2018/12/21 01:45:52 failed to start the controlplane. retried 5 times
FAIL    github.com/cstoku/kubebuilder-test-controller/pkg/controller/echofield  0.018s
?       github.com/cstoku/kubebuilder-test-controller/pkg/webhook       [no test files]
?       github.com/cstoku/kubebuilder-test-controller/cmd/manager       [no test files]
make: *** [Makefile:9: test] Error 1
2018/12/21 01:45:52 exit status 2
```

## ローカル環境での実行

それでは、初期状態でのControllerの実行してみる。

ローカルといっても手元のconfigから接続出来るKubernetes Clusterに導入を行う。
ないようであれば[こちら](/posts/2018/k8sdojo-02/)を参考にローカル環境を立てるのが良いだろう。

準備ができたら `make install` を実行しよう。

```plain
$ make install
 go run vendor/sigs.k8s.io/controller-tools/cmd/controller-gen/main.go all
 CRD manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/crds'
 RBAC manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/rbac'
 kubectl apply -f config/crds
 customresourcedefinition.apiextensions.k8s.io/echofields.trial.cstoku.dev created
```

ログを見る感じ、 `controller-gen` を実行してCRDを適用したようだ。

次は `make run` で実際に実行してみる。

```plain
go generate ./pkg/... ./cmd/...
go fmt ./pkg/... ./cmd/...
go vet ./pkg/... ./cmd/...
go run ./cmd/manager/main.go
{"level":"info","ts":1545324635.4268575,"logger":"entrypoint","msg":"setting up client for manager"}
{"level":"info","ts":1545324635.4326477,"logger":"entrypoint","msg":"setting up manager"}
{"level":"info","ts":1545324635.4595976,"logger":"entrypoint","msg":"Registering Components."}
{"level":"info","ts":1545324635.4596338,"logger":"entrypoint","msg":"setting up scheme"}
{"level":"info","ts":1545324635.459897,"logger":"entrypoint","msg":"Setting up controller"}
{"level":"info","ts":1545324635.4599698,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"echofield-controller","source":"kind source: /, Kind="}
{"level":"info","ts":1545324635.4600892,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"echofield-controller","source":"kind source: /, Kind="}
{"level":"info","ts":1545324635.4601424,"logger":"entrypoint","msg":"setting up webhooks"}
{"level":"info","ts":1545324635.460151,"logger":"entrypoint","msg":"Starting the Cmd."}
{"level":"info","ts":1545324635.5639021,"logger":"kubebuilder.controller","msg":"Starting Controller","controller":"echofield-controller"}
{"level":"info","ts":1545324635.664216,"logger":"kubebuilder.controller","msg":"Starting workers","controller":"echofield-controller","worker count":1}
```

さて、何やら実行されたようだ。実はここまでの数コマンドでコントローラーのビルドと実行が出来ており、先程作成したCRDのコントローラーとして機能しているのだ。

別のターミナルからサンプルで作成されているManifestを適用してみよう。

```plain
$ kubectl apply -f config/samples/trial_v1alpha1_echofield.yaml
echofield.trial.cstoku.dev/echofield-sample created
```

するとコントローラーを実行している方でログが出力されているはずだ。

色々と `kubectl get` で取得してみよう。

```plain
$ kubectl get echofield
NAME               AGE
echofield-sample   2m
$ kubectl get all
NAME                                               READY     STATUS    RESTARTS   AGE
pod/echofield-sample-deployment-6bdd78b879-g9v5v   1/1       Running   0          2m14s

NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   3d12h
service/nginx        ClusterIP   10.108.165.92   <none>        80/TCP    3d12h

NAME                                          READY     UP-TO-DATE   AVAILABLE   AGE
deployment.apps/echofield-sample-deployment   1/1       1            1           2m14s

NAME                                                     DESIRED   CURRENT   READY     AGE
replicaset.apps/echofield-sample-deployment-6bdd78b879   1         1         1         2m14s
```

どうやら今実行しているコントローラーはDeploymentを作ってくれているらしい。

## コントローラーの実装を変更する

突然Deploymentを生成されても困るので、実装を変更しよう。

コントローラーのロジックを実装したい場合は、途中の出力にもあったが `pkg/controller/echofield/echofield_controller.go` にあるファイルに実装していけば良い。 

開いてみると重要な箇所がいくつかある。見ていこう。

{{< highlight go "linenostart=57" >}}
// add adds a new Controller to mgr with r as the reconcile.Reconciler
func add(mgr manager.Manager, r reconcile.Reconciler) error {
	// Create a new controller
	c, err := controller.New("echofield-controller", mgr, controller.Options{Reconciler: r})
	if err != nil {
		return err
	}

	// Watch for changes to EchoField
	err = c.Watch(&source.Kind{Type: &trialv1alpha1.EchoField{}}, &handler.EnqueueRequestForObject{})
	if err != nil {
		return err
	}

	// TODO(user): Modify this to be the types you create
	// Uncomment watch a Deployment created by EchoField - change this for objects you create
	err = c.Watch(&source.Kind{Type: &appsv1.Deployment{}}, &handler.EnqueueRequestForOwner{
		IsController: true,
		OwnerType:    &trialv1alpha1.EchoField{},
	})
	if err != nil {
		return err
	}

	return nil
}
{{< / highlight >}}

Watch APIを呼んでいるようだ。今は `EchoField` だけ見てればいいので `Deployment` の方は消してしまおう。

次に実際を処理している部分を見ていく。

{{< highlight go "linenostart=99" >}}
func (r *ReconcileEchoField) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	// Fetch the EchoField instance
	instance := &trialv1alpha1.EchoField{}
	err := r.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Object not found, return.  Created objects are automatically garbage collected.
			// For additional cleanup logic use finalizers.
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}

	// TODO(user): Change this to be the object type created by your controller
	// Define the desired Deployment object
	deploy := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      instance.Name + "-deployment",
			Namespace: instance.Namespace,
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"deployment": instance.Name + "-deployment"},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: map[string]string{"deployment": instance.Name + "-deployment"}},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "nginx",
							Image: "nginx",
						},
					},
				},
			},
		},
	}
	if err := controllerutil.SetControllerReference(instance, deploy, r.scheme); err != nil {
		return reconcile.Result{}, err
	}

	// TODO(user): Change this for the object type created by your controller
	// Check if the Deployment already exists
	found := &appsv1.Deployment{}
	err = r.Get(context.TODO(), types.NamespacedName{Name: deploy.Name, Namespace: deploy.Namespace}, found)
	if err != nil && errors.IsNotFound(err) {
		log.Printf("Creating Deployment %s/%s\n", deploy.Namespace, deploy.Name)
		err = r.Create(context.TODO(), deploy)
		if err != nil {
			return reconcile.Result{}, err
		}
	} else if err != nil {
		return reconcile.Result{}, err
	}

	// TODO(user): Change this for the object type created by your controller
	// Update the found object and write the result back if there are any changes
	if !reflect.DeepEqual(deploy.Spec, found.Spec) {
		found.Spec = deploy.Spec
		log.Printf("Updating Deployment %s/%s\n", deploy.Namespace, deploy.Name)
		err = r.Update(context.TODO(), found)
		if err != nil {
			return reconcile.Result{}, err
		}
	}
	return reconcile.Result{}, nil
}
{{< / highlight >}}

`Deployment` オブジェクトを作って見つからなければ作成するし、既にあって差分がある場合は更新している。

この処理のおかげで突如 `Deployment` が作成されたわけだ。こんな処理取っ払ってしまおう :collision:

一旦以下のような状態にした。

{{< highlight go "linenostart=99" >}}
func (r *ReconcileEchoField) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	// Fetch the EchoField instance
	instance := &trialv1alpha1.EchoField{}
	err := r.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Object not found, return.  Created objects are automatically garbage collected.
			// For additional cleanup logic use finalizers.
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}

	return reconcile.Result{}, nil
}
{{< / highlight >}}

さて、今回は `EchoField` の `spec.field` に指定されたものをそのまま `status.field` にセットする処理を実装しよう。

{{< highlight go "linenostart=99" >}}
func (r *ReconcileEchoField) Reconcile(request reconcile.Request) (reconcile.Result, error) {
	// Fetch the EchoField instance
	instance := &trialv1alpha1.EchoField{}
	err := r.Get(context.TODO(), request.NamespacedName, instance)
	if err != nil {
		if errors.IsNotFound(err) {
			// Object not found, return.  Created objects are automatically garbage collected.
			// For additional cleanup logic use finalizers.
			return reconcile.Result{}, nil
		}
		// Error reading the object - requeue the request.
		return reconcile.Result{}, err
	}

	desire := instance.DeepCopy()
	if desire.Status.Field != instance.Spec.Field {
		desire.Status.Field = instance.Spec.Field
		log.Printf("Updating EchoField %s/%s\n", instance.Namespace, instance.Name)
		err = r.Update(context.TODO(), desire)
		if err != nil {
			return reconcile.Result{}, err
		}
	}
	return reconcile.Result{}, nil
}
{{< / highlight >}}

DeepCopyでオブジェクトを複製して、 `spec.field` と `status.field` を比較している。差分があったら `desire` を更新して `Update` を呼んでいる。

さて、 `field` というフィールドを作成したので、Structも更新しよう。 `pkg/apis/trial/v1alpha1/echofield_types.go` にある以下の部分だ。

{{< highlight go "linenostart=27" >}}
type EchoFieldSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// EchoFieldStatus defines the observed state of EchoField
type EchoFieldStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}
{{< / highlight >}}

この2つの構造体に `field` を足そう。

{{< highlight go "linenostart=27" >}}
type EchoFieldSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	Field string `json:"field"`
}

// EchoFieldStatus defines the observed state of EchoField
type EchoFieldStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	Field string `json:"field,omitempty"`
}
{{< / highlight >}}

さて、 コメントに書いてあるように `make` を実行してから `make install` と `make run` を実行してみよう。

```plain
$ make
go generate ./pkg/... ./cmd/...
go fmt ./pkg/... ./cmd/...
go vet ./pkg/... ./cmd/...
go run vendor/sigs.k8s.io/controller-tools/cmd/controller-gen/main.go all
CRD manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/crds'
RBAC manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/rbac'
go test ./pkg/... ./cmd/... -coverprofile cover.out
?       github.com/cstoku/kubebuilder-test-controller/pkg/apis  [no test files]
?       github.com/cstoku/kubebuilder-test-controller/pkg/apis/trial    [no test files]
2018/12/21 03:11:55 failed to start the controlplane. retried 5 times
FAIL    github.com/cstoku/kubebuilder-test-controller/pkg/apis/trial/v1alpha1   0.026s
?       github.com/cstoku/kubebuilder-test-controller/pkg/controller    [no test files]
2018/12/21 03:11:55 failed to start the controlplane. retried 5 times
FAIL    github.com/cstoku/kubebuilder-test-controller/pkg/controller/echofield  0.011s
?       github.com/cstoku/kubebuilder-test-controller/pkg/webhook       [no test files]
?       github.com/cstoku/kubebuilder-test-controller/cmd/manager       [no test files]
make: *** [Makefile:9: test] Error 1
$ make install
go run vendor/sigs.k8s.io/controller-tools/cmd/controller-gen/main.go all
CRD manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/crds'
RBAC manifests generated under '/home/cs_toku/go/src/github.com/cstoku/kubebuilder-test-controller/config/rbac'
kubectl apply -f config/crds
customresourcedefinition.apiextensions.k8s.io/echofields.trial.cstoku.dev configured
$ make run
make run
go generate ./pkg/... ./cmd/...
go fmt ./pkg/... ./cmd/...
go vet ./pkg/... ./cmd/...
go run ./cmd/manager/main.go
{"level":"info","ts":1545329632.4990416,"logger":"entrypoint","msg":"setting up client for manager"}
{"level":"info","ts":1545329632.5055401,"logger":"entrypoint","msg":"setting up manager"}
{"level":"info","ts":1545329632.5347497,"logger":"entrypoint","msg":"Registering Components."}
{"level":"info","ts":1545329632.534778,"logger":"entrypoint","msg":"setting up scheme"}
{"level":"info","ts":1545329632.5348616,"logger":"entrypoint","msg":"Setting up controller"}
{"level":"info","ts":1545329632.5348947,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"echofield-controller","source":"kind source: /, Kind="}
{"level":"info","ts":1545329632.5349865,"logger":"kubebuilder.controller","msg":"Starting EventSource","controller":"echofield-controller","source":"kind source: /, Kind="}
{"level":"info","ts":1545329632.535034,"logger":"entrypoint","msg":"setting up webhooks"}
{"level":"info","ts":1545329632.535041,"logger":"entrypoint","msg":"Starting the Cmd."}
{"level":"info","ts":1545329632.6352468,"logger":"kubebuilder.controller","msg":"Starting Controller","controller":"echofield-controller"}
{"level":"info","ts":1545329632.7355602,"logger":"kubebuilder.controller","msg":"Starting workers","controller":"echofield-controller","worker count":1}
```

改めて、 `EchoField` のリソースを作成してみよう。以下のようなManifestを作成した。

```yaml
apiVersion: trial.cstoku.dev/v1alpha1
kind: EchoField
metadata:
  name: echofield-sample
spec:
  field: "hello!!"
```

適用して取得してみる。

```plain
kubectl apply -f echofield.yaml
echofield.trial.cstoku.dev/echofield-sample created
kubectl get -f echofield.yaml -o yaml
apiVersion: trial.cstoku.dev/v1alpha1
kind: EchoField
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"trial.cstoku.dev/v1alpha1","kind":"EchoField","metadata":{"annotations":{},"name":"echofield-sample","namespace":"default"},"spec":{"field":"hello!!"}}
  creationTimestamp: 2018-12-20T18:25:22Z
  generation: 2
  name: echofield-sample
  namespace: default
  resourceVersion: "371823"
  selfLink: /apis/trial.cstoku.dev/v1alpha1/namespaces/default/echofields/echofield-sample
  uid: 9ca1c900-0484-11e9-adf0-dc51cfa8f3cb
spec:
  field: hello!!
status:
  field: hello!!
```

`status.field` に `spec.field` の値が入っていることが分かる。


# 最後に

このような流れで簡単にカスタムコントローラーの実装を始めることが出来る。ついでに上記で作ったコードは以下に置いておく。

[cstoku/kubebuilder-test-controller](https://github.com/cstoku/kubebuilder-test-controller)

今回は本当に簡単でシンプルなコントローラーを書いたが、もちろん他にも色々な機能が提供されているので、それらについてはまた別の記事(きっとある。)で解説できればと思う。

それでは！

