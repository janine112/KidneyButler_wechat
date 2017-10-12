angular.module('kidney.filters', [])
// 毫秒数 to '10:32 AM' or '4/1/17 4:55 PM'（不是当天的话） XJZ
.filter('msgdate', ['$filter', function ($filter) {
  return function (milliseconds) {
    if (milliseconds == null) return ''
    var curTime = new Date()
    var msgTime = new Date(milliseconds)
    if (curTime.toDateString() == msgTime.toDateString()) return $filter('date')(msgTime, 'H:mm')
    return $filter('date')(msgTime, 'M/d/yy H:mm')
  }
}])
.filter('dateFormat', ['$filter', function ($filter) {
  return function (date, format) {
    var d = new Date(date)
    var ret = ''
    if (date == null) { return '-' }
    switch (format) {
      case 'YYYY-MM-DD':
        ret = $filter('date')(d, 'yyyy-MM-dd')
        break
      case 'MM-DD-YYYY':
        ret = $filter('date')(d, 'MM-dd-yyyy')
        break
      case 'YYYY-MM-DD h:m':
        ret = $filter('date')(d, 'yyyy-MM-dd HH:mm')

        break
    }
    return ret
  }
}])

.filter('filterClass', [function () {
  return function (type) {
    var name
    switch (type) {
      case 'class_2':
        name = 'CKD1-2期'
        break
      case 'class_3':
        name = 'CKD3-4期'
        break
      case 'class_4':
        name = 'CDK5期未透析'
        break
      case 'class_6':
        name = '腹透'
        break
      case 'class_5':
        name = '血透'
        break
      case 'class_1':
        name = '肾移植'
        break
    }
    return name
  }
}])
.filter('filterStage', [function () {
  return function (type) {
    var name
    switch (type) {
      case 'stage_5':
        name = '疾病活跃期'
        break
      case 'stage_6':
        name = '稳定期'
        break
      case 'stage_7':
        name = '>3年'
        break
    }
    return name
  }
}])

.filter('filterHypertension', [function () {
  return function (type) {
    var name = '--'
    switch (type) {
      case 1:
        name = '是'
        break
      case 2:
        name = '否'
        break
    }
    return name
  }
}])

.filter('filterOrderType', [function () {
  return function (type) {
    var name = '未定义'
    switch (type) {
      case 1:
        name = '咨询'
        break
      case 2:
        name = '问诊'
        break
      case 3:
        name = '咨询升级问诊'
        break
      case 4:
        name = '主管医生'
        break
      case 5:
        name = '面诊'
        break
      case 6:
        name = '加急咨询'
        break
      case 7:
        name = '咨询升级加急咨询'
        break
    }
    return name
  }
}])

.filter('filterPayStatus', [function () {
  return function (type) {
    var name = '未定义'
    switch (type) {
      case 0: case 1:
        name = '付款失败'
        break
      case 2:
        name = '支付成功'
        break
      case 3:
        name = '支付失败'
        break
      case 4:
        name = '取消订单'
        break
      case 5:
        name = '订单超时'
        break
      case 6:
        name = '正在退款'
        break
      case 7:
        name = '退款关闭'
        break
      case 8:
        name = '退款异常'
        break
      case 9:
        name = '退款成功'
        break
    }
    return name
  }
}])

// 微信以分计算，所以需要除以100再转为两位小数
.filter('filterMoney', [function () {
  return function (num) {
    if (isNaN(num)) return
    return num === 0 ? num.toFixed(2) : (num / 100).toFixed(2)
  }
}])

.filter('periodFilter', [function () {
  return function (periodTime, index) {
    var dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    if (index % 2 == 0) {
      return periodTime
    } else {
      var day = new Date()
      day.setTime(Date.parse(periodTime))
      // console.log(day.getDay())
      return dayName[day.getDay()]
    }

    // console.log(day)
  }
}])

.filter('canAppointFilter', [function () {
  return function (amount) {
    var name = '(' + amount + ') '
    return name + (amount === 0 ? '不可预约' : '可预约')
  }
}])

.filter('filterOrderStatus', [function () {
  return function (containObject, type) {
    switch (type) {
      case 'consult':
        name = containObject ? (containObject.status === 0 ? '已结束' : '进行中') : '尚未新建'
        break
      case 'incharge':
        if (containObject) {
          switch (containObject.invalidFlag) {
            case 0:
              name = '待审核'
              break
            case 1:
              name = '已通过'
              break
            case 2:
              name = '已删除'
              break
            case 3:
              name = '未通过'
              break
          }
        } else {
          name = '提交失败'
        }
        break
      case 'appointment':
        if (containObject) {
          // 0: 待核销，1: 医生完成核销，2: 过期自动核销，3: 患者取消，直接退款，4: 医生停诊或取消，直接退款，5: 患者申请取消，等待人工处理退款，6: 医生停诊或取消，等待人工通知，7:患者取消，人工处理不予退款，8:患者取消，人工退款，9：医生停诊或取消，人工通知完成【1／2都是订单完成，3/4/8／9都是退款完成，5/6等待人工，7不予退款
          switch (containObject.status) {
            case 0:
              name = '等待核销'
              break
            case 1:
              name = '医生核销'
              break
            case 2:
              name = '逾期核销'
              break
            case 3:
              name = '预约取消'
              break
            case 4:
              name = '医生停诊'
              break
            case 5:
              name = '人工处理'
              break
            case 6:
              name = '正在退款'
              break
            case 7:
              name = '退款失败'
              break
            case 8:case 9:
              name = '退款成功'
              break
          }
        } else {
          name = '预约失败'
        }
        break
    }
    return name
  }
}])
