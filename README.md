## Home Maid Jane

Raspberry Pi から Nature Remo, Switch bot を操作するための AWS IoT の Subscriber。

### 動作確認環境

- Raspberry Pi 3 Model B
- Raspbian Jessie with Pixel

### 構成

Alexa Home Skill & AWS Lambda と連携させる場合は、以下のようになる。

``` shell
Amazon Echo -(invoke)-> AWS Lambda -(Publish)-> AWS IoT <-(Subscribe)- Raspberry Pi ---> Switch bot ---> Humidifier
                                                                                     └-> Nature Remo --> Loom Right
```

### 通信対象とその用途

- AWS IoT
  - AWS IoT に対し別のデバイス (例: AWS Lambda) から Publish されたメッセージを Subscribe し、メッセージ受信時に Raspberry Pi 上で処理をトリガーする
- Nature Remo
  - Raspberry Pi からローカルネットワーク内に存在する Nature Remo に対して Local API を叩き、リモコン操作をする
- Switch bot
  - Raspberry Pi から Bluetooth 経由でトリガーし、デバイスのスイッチをトグルする
- Amazon CloudWatch Logs
  - ログの記録。アクセス権限を付与するために IAM User の事前の登録と、そのキーペアの Raspberry Pi 上での設定が必要


## 設定

### AWS IoT

事前に、AWS IoT において、モノ、証明書、 ポリシーを作成しておく。`./config.template.json` を参考に、以下のような `./config.json` を作成し、各々の情報を埋める。
`topic` には、Pub/Sub したい任意のトピック名を設定する。

``` json
{
  "host": "xxxxxxxxxxxxx-yyy.iot.us-west-2.amazonaws.com",
  "port": 8883,
  "clientId": "YourClientName",
  "thingName": "YourThingName",
  "caCert": "rootCA.crt",
  "clientCert": "xxxxxxxxxx-certificate.pem.crt",
  "privateKey": "xxxxxxxxxx-private.pem.key",
  "region": "us-west-2",
  "topic": "test/pub"
}
```

作成した証明書は、`./certifications` 以下に、設定ファイルに記述したファイル名と同名で配置する。

### Nature Remo

IP アドレスは以下の方法で特定する。

``` shell
# サービス _remo._tcp から検索
$ dns-sd -B _remo._tcp
Browsing for _remo._tcp
DATE: ---Sat 29 Dec 2018---
14:06:56.571  ...STARTING...
Timestamp     A/R    Flags  if Domain               Service Type         Instance Name
14:06:56.726  Add        2   8 local.               _remo._tcp.          Remo-XXXXXX

# IP アドレスを解決する
$ dns-sd -G v4 Remo-XXXXXX.local
DATE: ---Sat 29 Dec 2018---
14:07:06.213  ...STARTING...
Timestamp     A/R    Flags if Hostname                               Address                                      TTL
14:07:06.213  Add        2  8 Remo-XXXXXX.local.                     192.168.11.4                                 120

# 192.168.11.4 を ADDRESS に指定する
```

SIGNAL 情報を取得したい場合は、以下の手順をふむ。

1. 取得したい赤外線を発するデバイスで、Remo に向けて赤外線を飛ばす
  - Remo は、赤外線を受信すると青いリングが点滅する
2. [Local API](http://local.swagger.nature.global/) の　`/messages` に対して GET リクエストを送る

``` shell
$ curl "http://192.168.11.4/messages" -H "X-Requested-With: curl"
{"format":"us","freq":38,"data":[8898, ... ,522]}% 
```

`./scripts/light/config.template.ini` を参考に、`./scipts/light/config.ini` を作成する。

``` shell
ADDRESS='192.168.11.4'
ON_SIGNAL='{"format":"us","freq":36,"data":[3467,...,367]}'
OFF_SIGNAL='{"format":"us","freq":35,"data":[3444,...,360]}'
```

### Switch bot

Switch bot のトリガーには、OSS の　[python-host](https://github.com/OpenWonderLabs/python-host) を利用する。
Rapberry Pi 上で以下を実行。

``` shell
# 依存ライブラリインストール
$ sudo apt-get update
$ sudo apt-get install python-pexpect
$ sudo apt-get install libusb-dev libdbus-1-dev libglib2.0-dev 
$ sudo apt-get install libudev-dev libical-dev libreadline-dev
$ sudo pip install bluepy

# Python host ダウンロード
$ git clone https://github.com/OpenWonderLabs/python-host.git ./scripts/humidifier/python-host

# MAC アドレスを取得
$ sudo python ./scripts/humidifier/python-host/switchbot.py
Usage: "sudo python switchbot.py [mac_addr  cmd]" or "sudo python switchbot.py"
Start scanning...
scan timeout
(0, [u'c1:xx:xx:xx:xx:22', 'Press'])
```

`./scripts/humidifier/config.template.ini` を参考に、`./scipts/humidifier/config.ini` を作成する。

``` shell
MAC_ADDR='c1:xx:xx:xx:xx:22'
```

### IAM User

aws-sdk を通じて CloudWatch Logs にログを送信するために、以下のポリシーをアタッチした IAM User を作成する。

``` json
{
  "Version":"2012-10-17",
  "Statement": [
     {
       "Effect":"Allow",
       "Action": [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
       ],
       "Resource":"arn:aws:logs:*:*:*"
     }
  ]
}
```

さらに、そのキーペアを `~/.aws/credentials` に、以下のように設定する。

```
[default]
aws_access_key_id = ACCESS_KEY
aws_secret_access_key = SECRET_KEY
```

## 実行

``` shell
$ npm install --production
$ node src/index.js
```
