'use strict'

const fs = require('fs')
const awsIot = require('aws-iot-device-sdk')
const isUndefined = require('./is-undefined')
const exec = require('child_process').exec
const bunyan = require('bunyan')
var createCWStream = require('bunyan-cloudwatch')
var cwStream = createCWStream({
  logGroupName: '/mansion-server/HomeMaidJane',
  logStreamName: 'stream',
  cloudWatchLogsOptions: {
    region: 'us-west-2'
  }
})
const logger = bunyan.createLogger({
  name: 'HomeMaidJane',
  streams: [
    {
      level: 'info',
      stream: cwStream,
      type: 'raw'
    }
  ]
})

function main(args) {
  const device = awsIot.device({
    keyPath: args.privateKey,
    certPath: args.clientCert,
    caPath: args.caCert,
    clientId: args.clientId,
    region: args.region,
    baseReconnectTimeMs: 4000,
    keepalive: 300,
    protocol: 'mqtts',
    port: args.Port,
    host: args.Host
  })

  device.subscribe(`${args.topic}/#`)

  device.on('connect', function() {
    logger.info('connected')
  })
  device.on('close', function() {
    logger.info('closed')
  })
  device.on('reconnect', function() {
    logger.info('reconnected')
  })
  device.on('offline', function() {
    logger.info('offline')
  })
  device.on('error', function(error) {
    logger.error(error)
  })
  device.on('message', function(topic, payload) {
    logger.info({ topic, payload }, 'message received')

    switch (topic) {
      case `${args.topic}/room-humidifier/TurnOn`:
      case `${args.topic}/room-humidifier/TurnOff`:
        exec(
          './scripts/humidifier/switch_humidifier.sh',
          (err, stdout, stderr) => {
            if (err) {
              logger.error(err, { stderr })
            }
            logger.info({ stdout })
          }
        )
        break
      case `${args.topic}/room-light/TurnOn`:
        exec('./scripts/light/switch_light.sh on', (err, stdout, stderr) => {
          if (err) {
            logger.error(err, { stderr })
          }
          logger.info({ stdout })
        })
        break
      case `${args.topic}/room-light/TurnOff`:
        exec('./scripts/light/switch_light.sh off', (err, stdout, stderr) => {
          if (err) {
            logger.error(err, { stderr })
          }
          logger.info({ stdout })
        })
        break
      default:
        logger.warn('Unexpected message received: %s', topic)
    }
  })
}

/**
 * 設定ファイルから設定項目を読み込む
 *
 * host:       ホスト名
 * port:       ポート番号
 * clientId:   クライアントID
 * thingName:  モノの名称
 * caCert:     CA ルート証明書
 * clientCert: クライアント証明書
 * privateKey: プライベート証明書
 *
 * @param {} configFilePath
 * @param {*} certDir
 */
function read(configFilePath, certDir) {
  let args = {}

  if (!fs.existsSync(configFilePath)) {
    logger.error("%s doesn't exist", configFilePath)
    return
  }
  var config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'))

  if (!isUndefined(config.privateKey)) {
    if (!isUndefined(certDir)) {
      args.privateKey = certDir + '/' + config.privateKey
    } else {
      args.privateKey = config.privateKey
    }
  }

  if (!isUndefined(config.clientCert)) {
    if (!isUndefined(certDir)) {
      args.clientCert = certDir + '/' + config.clientCert
    } else {
      args.clientCert = config.clientCert
    }
  }

  if (!isUndefined(config.caCert)) {
    if (!isUndefined(certDir)) {
      args.caCert = certDir + '/' + config.caCert
    } else {
      args.caCert = config.caCert
    }
  }

  if (!isUndefined(config.host)) {
    args.Host = config.host
  }

  if (!isUndefined(config.port)) {
    args.Port = config.port
  }

  if (!isUndefined(config.clientId) && isUndefined(args.clientId)) {
    args.clientId = config.clientId
  }

  if (!isUndefined(config.thingName)) {
    args.thingName = config.thingName
  }

  if (!isUndefined(config.region)) {
    args.region = config.region
  }

  if (!isUndefined(config.topic)) {
    args.topic = config.topic
  }

  return args
}

main(read('./config.json', './certifications'))
