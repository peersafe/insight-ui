/* eslint no-unused-vars: 1 */
'use strict'

function ApiHandler(baseURL) {
  var self = this
  var timeFormat = 'YYYY-MM-DDTHH:mm:ss'

  self.url = baseURL

  /**
   * formatTime
   */

  function formatTime(time) {
    return moment.utc(time).format(timeFormat)
  }

  this.getTx = function(hash, callback) {
    var url = self.url + '/transactions/' + hash

    return d3.json(url, function(err, resp) {
      if (err) {
        callback({
          status: err.status,
          text: err.statusText || 'Unable to load data'
        })

      } else {
        callback(null, resp)
      }
    })
  }

  this.getBitTx = function (address, callback) {
      var url = self.url + '/txs?address=' + address

      return d3.json(url, function (err, resp) {
          if (err) {
              callback({
                  status: err.status,
                  text: err.statusText || 'Unable to load address'
              })

          } else {
              callback(null, resp)
          }
      })
  }

  this.getTxByHash = function(hash, callback) {
    var url = self.url + '/tx/' + hash

    return d3.json(url, function(err, resp) {
      if (err) {
          alert('err'+err)
          callback(null,'')
      } else {
        alert('res'+resp);
        callback(null, resp)
      }
    })
  }

  this.getAccountTx = function(params, callback) {
    var url = self.url + '/accounts/' + params.account + '/transactions'
    var limit = params.limit ? '&limit=' + params.limit : ''
    var marker = params.marker ?
      '&marker=' + params.marker : ''
    var descending = params.descending ?
      '&descending=true' : ''

    url += '?' + limit + marker + descending
    return d3.json(url, function(err, resp) {
      if (err) {
        callback({
          status: err.status,
          text: err.statusText || 'Unable to load data'
        })

      } else {
        callback(null, resp)
      }
    })
  }
  this.getTxByAddress = function(params, callback) {
    var url = self.url + '/adds/' + params.address + '/txs'
    var from =  '&from=0'
    var to = params.to ? '&to=' + params.to : ''
    url += '?' + from + to
    return d3.json(url, function(err, resp) {
      if (err) {
        callback({
          status: err.status,
          text: err.statusText || 'Unable to load data'
        })

      } else {
        callback(null, resp)
      }
    })
  }



  this.getTotalAccounts = function(time, callback) {
    var url = self.url + '/accounts?reduce=true&start=2013-01-01'

    if (time) {
      url += '&end=' + formatTime(time)
    }

    return d3.json(url, function(err, resp) {
      if (err) {
        callback({
          status: err.status,
          text: err.statusText || 'Unable to load data'
        })

      } else {
        callback(null, resp ? (resp.count || 0) : 0)
      }
    })
  }


  this.accountsCreated = function(params, callback) {
    var url = self.url + '/accounts?'
    var start = params.startTime ?
      '&start=' + formatTime(params.startTime) : ''
    var end = params.endTime ?
      '&end=' + formatTime(params.endTime) : ''
    var interval = params.timeIncrement ?
      '&interval=' + params.timeIncrement : ''
    var limit = '&limit=' + (params.limit || 1000)

    url += start + end + interval + limit

    return d3.json(url, function(err, resp) {
      if (err) {
        callback({
          status: err.status,
          text: err.statusText || 'Unable to load data'
        })

      } else {
        callback(null, resp)
      }
    })
  }

  this.getExchangeVolume = function(params, callback) {
    params.type = 'exchange_volume'
    getMetric(params, callback)
  }

  this.getPaymentVolume = function(params, callback) {
    params.type = 'payment_volume'
    getMetric(params, callback)
  }

  this.getIssuedValue = function(params, callback) {
    params.type = 'issued_value'
    getMetric(params, callback)
  }

  
}
