angular.module('ionic-datepicker.service', [])

  .service('IonicDatepickerService', function () {
    this.monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    this.getYearsList = function (from, to) {
      console.log(from, to)
      var yearsList = []
      var minYear = 1900
      var maxYear = new Date().getFullYear() + 1

      minYear = from ? new Date(from).getFullYear() : minYear
      maxYear = to ? new Date(to).getFullYear() : maxYear

      for (var i = maxYear; i >= minYear; i--) {
        yearsList.push(i)
      }

      return yearsList
    }
  })

angular.module('kidney.services', ['ionic', 'ngResource'])

// 客户端配置
.constant('CONFIG', {

    // 正式服务器地址
  // baseUrl: 'http://appserviceserver.haihonghospitalmanagement.com/api/v1/',
  // mediaUrl: 'http://appmediaservice.haihonghospitalmanagement.com/',
  // socketServer: 'ws://appserviceserver.haihonghospitalmanagement.com/',
  // imgThumbUrl: 'http://appmediaservice.haihonghospitalmanagement.com/uploads/photos/resize',
  // imgLargeUrl: 'http://appmediaservice.haihonghospitalmanagement.com/uploads/photos/',
  // 测试服务器地址
  // version2Url: 'http://121.43.107.106:4060/api/v2/',
  baseUrl: 'http://docker2.haihonghospitalmanagement.com/api/v2/',
  urineConnectUrl: 'http://docker2.haihonghospitalmanagement.com/',
  mediaUrl: 'http://df2.haihonghospitalmanagement.com/',
  // mediaUrl: 'http://121.43.107.106:8054/',
  socketServer: 'http://docker2.haihonghospitalmanagement.com/',
  imgThumbUrl: 'http://df2.haihonghospitalmanagement.com/uploads/photos/resize',
  imgLargeUrl: 'http://df2.haihonghospitalmanagement.com/uploads/photos/',
  //
  NiaodaifuUrl: 'https://open.niaodaifu.cn/wap/login',

  cameraOptions: {
    cam: {
      quality: 70,
      destinationType: 1,
      sourceType: 1,
      allowEdit: true,
      encodingType: 0,
      targetWidth: 1000,
      targetHeight: 1000,
      popoverOptions: false,
      saveToPhotoAlbum: false
    },
    gallery: {
      quality: 70,
      destinationType: 1,
      sourceType: 0,
      allowEdit: true,
      encodingType: 0,
      targetWidth: 1000,
      targetHeight: 1000
    }
  },
  // 咨询时最多能上传多少条健康信息
  maxHealthNumber: 3

})

// 本地存储函数
.factory('Storage', ['$window', function ($window) {
  return {
    set: function (key, value) {
      $window.localStorage.setItem(key, value)
    },
    get: function (key) {
      return $window.localStorage.getItem(key)
    },
    rm: function (key) {
      $window.localStorage.removeItem(key)
    },
    clear: function () {
      $window.localStorage.clear()
    }
  }
}])

// media文件操作 XJZ
.factory('fs', ['$q', '$cordovaFile', '$filter', function ($q, $cordovaFile, $filter) {
  return {
    mvMedia: function (type, fileName, ext) {
      return $q(function (resolve, reject) {
        if (type == 'voice') var path = cordova.file.externalRootDirectory
        else if (type == 'image') var path = cordova.file.externalCacheDirectory
        else reject('type must be voice or image')
        var time = new Date()
        var newName = $filter('date')(time, 'yyyyMMddHHmmss') + ext
        $cordovaFile.moveFile(path, fileName, cordova.file.dataDirectory, newName)
                  .then(function (success) {
                    // console.log(success);
                    resolve(success.nativeURL)
                  }, function (error) {
                    console.log(error)
                    reject(error)
                  })
      })
    }
  }
}])

// voice recorder XJZ
.factory('voice', ['$filter', '$q', '$ionicLoading', '$cordovaFile', 'CONFIG', 'Storage', 'fs', function ($filter, $q, $ionicLoading, $cordovaFile, CONFIG, Storage, fs) {
  var audio = {}
  audio.src = ''
  audio.media = {}

  audio.record = function (receiver, onSuccess, onError) {
    return $q(function (resolve, reject) {
      if (audio.media.src) audio.media.release()
      var time = new Date()
      audio.src = $filter('date')(time, 'yyyyMMddHHmmss') + '.amr'
      audio.media = new Media(audio.src,
                function () {
                  console.info('recordAudio():Audio Success')
                  console.log(audio.media)
                  $ionicLoading.hide()

                  fs.mvMedia('voice', audio.src, '.amr')
                        .then(function (fileUrl) {
                          console.log(fileUrl)
                          resolve(fileUrl)
                        }, function (err) {
                          console.log(err)
                          reject(err)
                        })
                },
                function (err) {
                  console.error('recordAudio():Audio Error')
                  console.log(err)
                  reject(err)
                })
      audio.media.startRecord()
      $ionicLoading.show({ template: 'recording' })
    })
  }
  audio.stopRec = function () {
    audio.media.stopRecord()
  }
  audio.open = function (fileUrl) {
    if (audio.media.src)audio.media.release()
    return $q(function (resolve, reject) {
      audio.media = new Media(fileUrl,
                function (success) {
                  resolve(audio.media)
                },
                function (err) {
                  reject(err)
                })
    })
  }
  audio.play = function (src) {
    audio.media.play()
  }
  audio.stop = function () {
    audio.media.stop()
  }
  audio.sendAudio = function (fileUrl, receiver) {
        // return $q(function(resolve, reject) {
    window.JMessage.sendSingleVoiceMessage(receiver, cordova.file.externalRootDirectory + fileUrl, CONFIG.appKey,
            function (response) {
              console.log('audio.send():OK')
              console.log(response)
                // $ionicLoading.show({ template: 'audio.send():[OK] '+response,duration:1500});
                // resolve(response);
            },
            function (err) {
                // $ionicLoading.show({ template: 'audio.send():[failed] '+err,duration:1500});
              console.log('audio.send():failed')
              console.log(err)
                // reject(err);
            })
        // });
  }
  return audio
}])

// 获取图片，拍照or相册，见CONFIG.cameraOptions。return promise。xjz
.factory('Camera', ['$q', '$cordovaCamera', '$cordovaFileTransfer', 'CONFIG', 'fs', 'Storage', function ($q, $cordovaCamera, $cordovaFileTransfer, CONFIG, fs, Storage) {
  return {
    getPicture: function (type, noCrop) {
      return $q(function (resolve, reject) {
        var opt = CONFIG.cameraOptions[type]
        if (noCrop) opt.allowEdit = false
        $cordovaCamera.getPicture(opt).then(function (imageUrl) {
          console.log(imageUrl)
          resolve(imageUrl)
              // file manipulation
              // var tail=imageUrl.lastIndexOf('?');
              // if(tail!=-1) var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1,tail);
              // else var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1);
              // fs.mvMedia('image',fileName,'.jpg')
              // .then(function(res){
              //   console.log(res);
              //   //res: file URL
              //   resolve(res);
              // },function(err){
              //   console.log(err);
              //   reject(err);
              // })
        }, function (err) {
          console.log(err)
          reject('fail to get image')
        })
      })
    },
    getPictureFromPhotos: function (type, noCrop) {
      console.log(type)
      return $q(function (resolve, reject) {
        var opt = CONFIG.cameraOptions[type]
        if (noCrop) opt.allowEdit = false
        $cordovaCamera.getPicture(opt).then(function (imageUrl) {
          console.log(imageUrl)
          resolve(imageUrl)
              // file manipulation
              // var tail=imageUrl.lastIndexOf('?');
              // if(tail!=-1) var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1,tail);
              // else var fileName=imageUrl.slice(imageUrl.lastIndexOf('/')+1);
              // fs.mvMedia('image',fileName,'.jpg')
              // .then(function(res){
              //   console.log(res);
              //   //res: file URL
              //   resolve(res);
              // },function(err){
              //   console.log(err);
              //   reject(err);
              // })
        }, function (err) {
          console.log(err)
          reject('fail to get image')
        })
      })
    },
    uploadPicture: function (imgURI, temp_photoaddress) {
      return $q(function (resolve, reject) {
        var uri = encodeURI(CONFIG.baseUrl + 'upload?token=' + Storage.get('TOKEN'))
            // var photoname = Storage.get("UID"); // 取出病人的UID作为照片的名字
        var options = {
          fileKey: 'file',
          fileName: temp_photoaddress,
          chunkedMode: true,
          mimeType: 'image/jpeg'
        }
            // var q = $q.defer();
            // console.log("jinlaile");
        $cordovaFileTransfer.upload(uri, imgURI, options)
              .then(function (r) {
                console.log('Code = ' + r.responseCode)
                console.log('Response = ' + r.response)
                console.log('Sent = ' + r.bytesSent)
                // var result = "上传成功";
                resolve(r.response)
              }, function (error) {
                console.log(error)
                alert('An error has occurred: Code = ' + error.code)
                alert('upload error source ' + error.source)
                alert('upload error target ' + error.target)
                reject(error)
              }, function (progress) {
                console.log(progress)
              })
      })
    }
  }
}])

// 数据模型
.factory('Data', ['$resource', '$q', '$interval', 'CONFIG', function ($resource, $q, $interval, CONFIG) {
  var serve = {}
  var abort = $q.defer()

  var Service = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'services'}, {
      appointDoc: {method: 'POST', params: {route: 'personalDiagnosis'}, timeout: 100000},
      docSchedual: {method: 'GET', params: {route: 'availablePD'}, timeout: 100000},
      cancelAppointment: {method: 'POST', params: {route: 'cancelMyPD'}, timeout: 100000},
      isMyDoctors: {method: 'GET', params: {route: 'relation'}, timeout: 10000}
    })
  }
  var Order = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'order'}, {
      GetOrders: {method: 'GET', params: {route: 'order'}, timeout: 100000},
      PaidUnfinishedOrders: {method: 'GET', params: {route: 'counsel'}, timeout: 100000}
    })
  }

  var Dict = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'dict'}, {
      getDiseaseType: {method: 'GET', params: {route: 'typeTwo'}, timeout: 100000},
      getDistrict: {method: 'GET', params: {route: 'district'}, timeout: 100000},
      getHospital: {method: 'GET', params: {route: 'hospital'}, timeout: 100000},
      getHeathLabelInfo: {method: 'GET', params: {route: 'typeOne'}, timeout: 100000}
      // typeOne: {method: 'GET', params: {route: 'typeOne'}, timeout: 100000}
    })
  }

  var Task = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'tasks'}, {
      changeTaskstatus: {method: 'POST', params: {route: 'status'}, timeout: 100000},
      changeTasktime: {method: 'POST', params: {route: 'time'}, timeout: 100000},
      insertTask: {method: 'POST', params: {route: 'taskModel'}, timeout: 100000},
      getUserTask: {method: 'GET', params: {route: 'task'}, timeout: 100000},
      updateUserTask: {method: 'POST', params: {route: 'task'}, timeout: 100000}
    })
  }

  var Compliance = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'compliance'}, {
      getcompliance: {method: 'GET', params: {route: 'compliances'}, timeout: 100000},
      postcompliance: {method: 'POST', params: {route: 'compliance'}, timeout: 100000}
    })
  }

  var insurance = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'insurance'}, {
      setPrefer: {method: 'POST', params: {route: 'prefer'}, timeout: 100000}
      // getPrefer: {method: 'GET', params: {route: 'prefer'}, timeout: 100000}

    })
  }

  var version = function () {
    return $resource(CONFIG.baseUrl + ':path', {path: 'version'}, {
      getVersion: {method: 'GET', params: {}, timeout: 100000}
    })
  }

  var Counsels = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'counsel'}, {
      getCounsel: {method: 'GET', params: {route: 'counsels'}, timeout: 100000},
      questionaire: {method: 'POST', params: {route: 'questionaire'}, timeout: 100000},
      getStatus: {method: 'GET', params: {route: 'status'}, timeout: 100000},
      // changeStatus: {method: 'POST', params: {route: 'status'}, timeout: 100000},
      changeType: {method: 'POST', params: {route: 'type'}, timeout: 100000},
      insertCommentScore: {method: 'POST', params: {route: 'commentScore'}, timeout: 100000}
    })
  }

  var Measurement = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'report'}, {
      getPatientSign: {method: 'GET', params: {route: 'vitalSigns'}, timeout: 10000}
    })
  }

  // var Temp = function () {
  //   return $resource(CONFIG.version2Url + ':path/:route', {path: 'patient'}, {

  //   })
  // }

  var Patient = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'patient'}, {
      getPatientDetail: {method: 'GET', params: {route: 'detail'}, timeout: 100000},
      getMyDoctors: {method: 'GET', params: {route: 'myDoctors'}, timeout: 10000},
      getDoctorLists: {method: 'GET', params: {route: 'doctors'}, timeout: 10000},
      getCounselRecords: {method: 'GET', params: {route: 'counselRecords'}, timeout: 10000},
            // insertDiagnosis:{method:'POST',params:{route:'diagnosis'},timeout:10000},
            // newPatientDetail:{method:'POST',params:{route:'detail'},timeout:10000},
      editPatientDetail: {method: 'POST', params: {route: 'editDetail'}, timeout: 10000},
      // bindingMyDoctor: {method: 'POST', params: {route: 'bindingMyDoctor'}, timeout: 10000},
      replacePhoto: {method: 'POST', params: {route: 'wechatPhotoUrl', patientId: '@patientId', wechatPhotoUrl: '@wechatPhotoUrl'}, timeout: 10000},
      ApplyDocInCharge: {method: 'POST', params: {route: 'doctorInCharge'}, timeout: 100000},
      FollowDoc: {method: 'POST', params: {route: 'favoriteDoctor'}, timeout: 100000},
      UnFollowDoc: {method: 'POST', params: {route: 'unfollowFavoriteDoctor'}, timeout: 100000},
      MyDocInCharge: {method: 'GET', params: {route: 'myDoctorsInCharge'}, timeout: 100000},
      CancelDocInCharge: {method: 'POST', params: {route: 'cancelDoctorInCharge'}, timeout: 100000},
      getFollowDoctors: {method: 'GET', params: {route: 'myFavoriteDoctors'}, timeout: 10000}
    })
  }

  var Doctor = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'doctor'}, {
            // createDoc:{method:'POST', params:{route: 'postDocBasic'}, timeout: 100000},
            // getPatientList:{method:'GET', params:{route: 'getPatientList'}, timeout: 100000},
      getDoctorInfo: {method: 'GET', params: {route: 'detail'}, timeout: 100000}
            // getMyGroupList:{method:'GET', params:{route: 'getMyGroupList'}, timeout: 100000},
            // getGroupPatientList:{method:'GET', params:{route: 'getGroupPatientList'}, timeout: 100000}
    })
  }

  var User = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'alluser'}, {
      register: {method: 'POST', skipAuthorization: true, params: {route: 'register', phoneNo: '@phoneNo', password: '@password', role: '@role'}, timeout: 100000},
      changePassword: {method: 'POST', skipAuthorization: true, params: {route: 'reset', phoneNo: '@phoneNo', password: '@password'}, timeout: 100000},
      logIn: {method: 'POST', skipAuthorization: true, params: {route: 'login'}, timeout: 100000},
      logOut: {method: 'POST', params: {route: 'logout', userId: '@userId'}, timeout: 100000},
      getUserID: {method: 'GET', params: {route: 'userID', username: '@username'}, timeout: 100000},
      sendSMS: {method: 'POST', skipAuthorization: true, params: {route: 'sms', mobile: '@mobile', smsType: '@smsType'}, timeout: 100000}, // 第一次验证码发送成功返回结果为”User doesn't exist“，如果再次发送才返回”验证码成功发送“
      verifySMS: {method: 'GET', skipAuthorization: true, params: {route: 'sms', mobile: '@mobile', smsType: '@smsType', smsCode: '@smsCode'}, timeout: 100000},
      getAgree: {method: 'GET', params: {route: 'agreement', userId: '@userId'}, timeout: 100000},
      updateAgree: {method: 'POST', skipAuthorization: true, params: {route: 'agreement'}, timeout: 100000},
      // getUserIDbyOpenId: {method: 'GET', skipAuthorization: true, params: {route: 'getUserIDbyOpenId'}, timeout: 100000},
      setUnionId: {method: 'POST', skipAuthorization: true, params: {route: 'unionid'}, timeout: 100000},
      setOpenId: {method: 'POST', skipAuthorization: true, params: {route: 'openId'}, timeout: 100000}

    })
  }

  var Health = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'healthInfo'}, {
      createHealth: {method: 'POST', params: {route: 'healthInfo', userId: '@userId', type: '@type', time: '@time', url: '@url', label: '@label', description: '@description', comments: '@comments'}, timeout: 100000},
      modifyHealth: {method: 'POST', params: {route: 'healthDetail', userId: '@userId', type: '@type', time: '@time', url: '@url', label: '@label', description: '@description', comments: '@comments', insertTime: '@insertTime'}, timeout: 100000},
      getHealthDetail: {method: 'GET', params: {route: 'healthDetail', userId: '@userId', insertTime: '@insertTime'}, timeout: 100000},
      getAllHealths: {method: 'GET', params: {route: 'healthInfos', userId: '@userId'}, timeout: 100000},
      deleteHealth: {method: 'POST', params: {route: 'deleteHealthDetail', userId: '@userId', insertTime: '@insertTime'}, timeout: 100000}

    })
  }

  var Comment = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'comment'}, {
      // getComments: {method: 'GET', params: {route: 'getComments'}, timeout: 100000},
      getCommentsByC: {method: 'GET', params: {route: 'commentsByCounsel'}, timeout: 100000},
      getCommentsByDoc: {method: 'GET', params: {route: 'commentsByDoc'}, timeout: 100000}
    })
  }

  var VitalSign = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'vitalSign'}, {
      getVitalSigns: {method: 'GET', params: {route: 'vitalSigns'}, timeout: 100000},
      insertVitalSign: {method: 'POST', params: {route: 'vitalSign'}, timeout: 100000}
    })
  }

  var Account = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'account'}, {
      // getAccountInfo: {method: 'GET', params: {route: 'getAccountInfo'}, timeout: 100000},
      getCounts: {method: 'GET', params: {route: 'counts'}, timeout: 100000},
      modifyCounts: {method: 'POST', params: {route: 'counts'}, timeout: 100000},
      // rechargeDoctor: {method: 'POST', params: {route: 'rechargeDoctor'}, timeout: 100000},
      updateFreeTime: {method: 'POST', params: {route: 'freeTime'}, timeout: 100000},
      getCountsRespective: {method: 'GET', params: {route: 'countsRespective'}, timeout: 100000}
    })
  }

  var Message = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'message'}, {
      getMessages: {method: 'GET', params: {route: 'messages'}, timeout: 100000},
      setMessagesRead:{method: 'POST', params: {route: 'status'}, timeout: 100000}
    })
  }

  var Advice = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'advice'}, {
      postAdvice: {method: 'POST', params: {route: 'advice'}, timeout: 100000}
    })
  }

  var News = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'new'}, {
      getNews: {method: 'GET', params: {route: 'news'}, timeout: 100000},
      insertNews: {method: 'POST', params: {route: 'news'}, timeout: 100000},
      getNewsByReadOrNot: {method: 'GET', params: {route: 'newsByReadOrNot'}, timeout: 100000},
      setReadOrNot: {method: 'POST', params: {route: 'newsStatus'}, timeout: 100000},
      getNotRead: {method: 'GET', params: {route: 'allNotReadNews'}, timeout: 100000}
    })
  }

  var Communication = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'communication'}, {
      getCommunication: {method: 'GET', params: {route: 'communication'}, timeout: 100000},
      newConsultation: {method: 'POST', params: {route: 'consultation'}, timeout: 100000}
            // getCounselReport:{method:'GET', params:{route: 'getCounselReport'}, timeout: 100000},
            // getTeam:{method:'GET', params:{route: 'getTeam'}, timeout: 100000},
            // insertMember:{method:'POST', params:{route: 'insertMember'}, timeout: 100000},
            // removeMember:{method:'POST', params:{route: 'removeMember'}, timeout: 100000}
    })
  }
  var Expense = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'expense'}, {
      rechargeDoctor: {method: 'POST', params: {route: 'rechargeDoctor'}, timeout: 100000}
    })
  }

  var Mywechat = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'wechat'}, {
      messageTemplate: {method: 'POST', params: {route: 'messageTemplate'}, timeout: 100000},
      // gettokenbycode: {method: 'GET', params: {route: 'gettokenbycode'}, timeout: 100000},
      addOrder: {method: 'POST', params: {route: 'addOrder'}, timeout: 100000},
      getUserInfo: {method: 'GET', skipAuthorization: true, params: {route: 'getUserInfo'}, timeout: 100000}
    })
  }

  var Mywechatphoto = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'wechat'}, {
      createTDCticket: {method: 'POST', params: {route: 'createTDCticket'}, timeout: 100000}
    })
  }

  var Devicedata = function () {
    return $resource(CONFIG.baseUrl + ':path/:route/:op', {path: 'devicedata'}, {
      devices: {method: 'GET', params: {route: 'devices'}, timeout: 10000},
      BPDeviceBinding: {method: 'POST', params: {route: 'BPDevice', op: 'binding'}, timeout: 10000},
      BPDeviceDeBinding: {method: 'POST', params: {route: 'BPDevice', op: 'debinding'}, timeout: 10000},
      urineConnect: {method: 'GET', url: CONFIG.urineConnectUrl + ':path/:route/:op', params: {route: 'niaodaifu', op: 'loginparam'}, timeout: 10000}
    })
  }

  var Forum = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {path: 'forump'}, {
      allposts: {method: 'GET', params: {route: 'allposts'}, timeout: 10000},
      myposts: {method: 'GET', params: {route: 'myposts'}, timeout: 10000},
      mycollection: {method: 'GET', params: {route: 'mycollection'}, timeout: 10000},
      newpost: {method: 'POST', params: {route: 'posting'}, timeout: 100000},
      favorite: {method: 'POST', params: {route: 'favorite'}, timeout: 100000},
      deletefavorite: {method: 'POST', params: {route: 'deletefavorite'}, timeout: 100000},
      deletepost: {method: 'POST', params: {route: 'deletepost'}, timeout: 100000},
      postcontent: {method: 'GET', params: {route: 'postcontent'}, timeout: 100000},
      deletecomment: {method: 'POST', params: {route: 'deletecomment'}, timeout: 100000},
      comment: {method: 'POST', params: {route: 'comment'}, timeout: 100000},
      reply: {method: 'POST', params: {route: 'reply'}, timeout: 100000}
    })
  }

  serve.abort = function ($scope) {
    abort.resolve()
    $interval(function () {
      abort = $q.defer()
      // serve.SecondVersion = SecondVersion()
      serve.Order = Order()
      serve.Service = Service()
      serve.Dict = Dict()
      serve.Task = Task()
            // serve.Task2 = Task2();
      serve.Compliance = Compliance()
      serve.Counsels = Counsels()
      serve.Measurement = Measurement()
      // serve.Temp = Temp()
      serve.Patient = Patient()
      serve.Doctor = Doctor()
      serve.Health = Health()
      serve.User = User()
      serve.Comment = Comment()
      serve.Mywechatphoto = Mywechatphoto()
      serve.VitalSign = VitalSign()
      serve.Account = Account()
      serve.Message = Message()
      serve.Advice = Advice()
      serve.News = News()
      serve.Expense = Expense()
      serve.insurance = insurance()
      serve.version = version()
      serve.Mywechat = Mywechat()
      serve.Communication = Communication()
      serve.devicedata = Devicedata()
      serve.Forum = Forum()
    }, 0, 1)
  }
  // serve.SecondVersion = SecondVersion()
  serve.Order = Order()
  serve.Service = Service()
  serve.Dict = Dict()
  serve.Task = Task()
    // serve.Task2 = Task2();
  serve.Compliance = Compliance()
  serve.Counsels = Counsels()
  serve.Measurement = Measurement()
  // serve.Temp = Temp()
  serve.Patient = Patient()
  serve.Doctor = Doctor()
  serve.Health = Health()
  serve.User = User()
  serve.Comment = Comment()
  serve.Mywechatphoto = Mywechatphoto()
  serve.VitalSign = VitalSign()
  serve.Account = Account()
  serve.Message = Message()
  serve.Advice = Advice()
  serve.News = News()
  serve.Expense = Expense()
  serve.insurance = insurance()
  serve.version = version()
  serve.Mywechat = Mywechat()
  serve.Communication = Communication()
  serve.Devicedata = Devicedata()
  serve.Forum = Forum()
  return serve
}])

.factory('Order', ['$q', 'Data', function ($q, Data) {
  var self = this
  // params->{token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.GetOrders = function (params) {
    var deferred = $q.defer()
    Data.Order.GetOrders(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

  self.PaidUnfinishedOrders = function (params) {
    var deferred = $q.defer()
    Data.Order.PaidUnfinishedOrders(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

  return self
}])

.factory('Service', ['$q', 'Data', function ($q, Data) {
  var self = this
  // params->{token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.appointDoc = function (params) {
    var deferred = $q.defer()
    Data.Service.appointDoc(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.docSchedual = function (params) {
    var deferred = $q.defer()
    Data.Service.docSchedual(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.cancelAppointment = function (params) {
    var deferred = $q.defer()
    Data.Service.cancelAppointment(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.isMyDoctors = function (params) {
    var deferred = $q.defer()
    Data.Service.isMyDoctors(
               params,
               function (data, headers) {
                 deferred.resolve(data)
               },
               function (err) {
                 deferred.reject(err)
               })
    return deferred.promise
  }

  return self
}])
.factory('Devicedata', ['$q', 'Data', function ($q, Data) {
  var self = this

    // params->{appId:'ssgj',twoDimensionalCode:'http://we.qq.com/d/AQBT7BO3BlTz76fGHXleVnu5t8dqu7uYwtxgoeuH',userId:'doc01'}
  self.BPDeviceBinding = function (params) {
    var deferred = $q.defer()
    Data.Devicedata.BPDeviceBinding(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

    // params->{appId:'ssgj',sn:'',imei:'',userId:''}
  self.BPDeviceDeBinding = function (params) {
    var deferred = $q.defer()
    Data.Devicedata.BPDeviceDeBinding(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

    // params->{userId:'doc01',deviceType:'sphygmomanometer'}
  self.devices = function (params) {
    var deferred = $q.defer()
    Data.Devicedata.devices(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
 // params->{client:'Android',userbind:'U201705170001',redirect_uri:'http://10.12.43.28:8100/#/tab/mine/devices/'}
  self.urineConnect = function (params) {
    var deferred = $q.defer()
    Data.Devicedata.urineConnect(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

  return self
}])

.factory('Dict', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
            //  category:'patient_class'
           // }
  self.getDiseaseType = function (params) {
    var deferred = $q.defer()
    Data.Dict.getDiseaseType(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  level:'3',//1获取省份，2获取城市，3获取区县
            //  province:"33", //定位到某个具体省份时需要输入
            //  city:'01',  //定位到某个具体城市时需要输入
            //  district:'02' //定位到某个具体区县时需要输入
           // }
  self.getDistrict = function (params) {
    var deferred = $q.defer()
    Data.Dict.getDistrict(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  locationCode:'330103',//输入全部为空时获取全部医院信息，需要定位到某个具体地区时需要输入locationCode，定位到某个具体医院时需要输入hospitalCode
            //  hostipalCode:"001"
           // }
  self.getHospital = function (params) {
    var deferred = $q.defer()
    Data.Dict.getHospital(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  category:'healthInfoType'
           // }
  self.getHeathLabelInfo = function (params) {
    var deferred = $q.defer()
    Data.Dict.getHeathLabelInfo(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
    //    category:'MessageType'
    // }
  // self.typeOne = function (params) {
  //   var deferred = $q.defer()
  //   Data.Dict.typeOne(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
  return self
}])

.factory('Task', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
            //  userId:'U201704050002',//usderId="Admin"，sortNo为空时获取系统全部任务模板，sortNo="1"时获取指定任务模板，userId为用户ID时获取指定用户的任务信息
            //  sortNo:'1'
           // }
    // self.getTask = function(params){
    //     var deferred = $q.defer();
    //     Data.Task1.getTask(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };
    // params->{
            //  userId:'U201704050002',//unique
            //  sortNo:1,
            //  type:'Measure',
            //  code:'BloodPressure',
            //  status:'0'
           // }
  self.changeTaskstatus = function (params) {
    var deferred = $q.defer()
    Data.Task.changeTaskstatus(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  userId:'U201704050002',//unique
            //  sortNo:1,
            //  type:'Measure',
            //  code:'BloodPressure',
            //  startTime:'2017-12-12'
           // }
  self.changeTasktime = function (params) {
    var deferred = $q.defer()
    Data.Task.changeTasktime(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  userId:'U201704050002',//unique
            //  sortNo:1,
           // }
  self.insertTask = function (params) {
    var deferred = $q.defer()
    Data.Task.insertTask(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.getUserTask = function (params) {
    var deferred = $q.defer()
    Data.Task.getUserTask(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.updateUserTask = function (params) {
    var deferred = $q.defer()
    Data.Task.updateUserTask(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  return self
}])

.factory('Compliance', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
            // "userId": "U201704050002",
            // "type": "Measure",
            // "code": "Weight",
            // "date": "2017-12-13",
            // "status": 0,
            // "description": ""
           // }
  self.postcompliance = function (params) {
    var deferred = $q.defer()
    Data.Compliance.postcompliance(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  userId:'U201704050002',//date为空时获取指定用户的全部任务执行记录，date不为空时获取指定用户某一天的任务执行记录
            //  date:'2017-12-13'
           // }
  self.getcompliance = function (params) {
    var deferred = $q.defer()
    Data.Compliance.getcompliance(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('version', ['$q', 'Data', '$cordovaAppVersion', '$ionicPopup', function ($q, Data, $cordovaAppVersion, $ionicPopup) {
  var self = this

  var getVersion = function (params) {
    var deferred = $q.defer()
    Data.version.getVersion(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.checkUpdate = function (scope) {
    $cordovaAppVersion.getAppVersion().then(function (version) {
          // alert(version);
      var json = {
        title: '',
        template: ''
      }
      var VersionParams = {
        versionName: version,
        versionType: 'apppatient'
      }
          // alert(JSON.stringify(VersionParams));

      getVersion(VersionParams).then(function (data) {
            // alert(JSON.stringify(data.results));
        if (angular.isArray(data.results.msg)) {
          json.title = '肾事管家有更新啦'
          for (x in data.results.msg) {
            json.template += "<p style = 'padding-left:15px;'>" + 'V' + data.results.msg[x].versionName + ' 更新: ' + data.results.msg[x].content + '</p>'
          }
          return $ionicPopup.alert({
            title: json.title,
            template: json.template,
            scope: scope,
            buttons: [
              {
                text: '我知道了',
                type: 'button button-block bg-6a fc-ff',
                onTap: function () {
                  return 'ok'
                }
              }
            ]
          })
        }
      }, function (err) {
            // alert("err");
      })
    })
  }

  return self
}])

.factory('otherTask', ['Task', 'Compliance', 'Storage', function (Task, Compliance, Storage) {
  // 封装了其他任务完成之后的要处理的一些服务
  var self = this
    // 其他任务后处理
    // 日期延后计算
  var UserId = Storage.get('UID')
  var DateCalc = function (LastDate, Type, Addition) {
    var Date1 = new Date(LastDate)
    var Date2
    if (Type == '周') // 周
      {
      Date2 = new Date(Date1.setDate(Date1.getDate() + Addition))
    } else if (Type == '月') {
      Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition))
    } else // 年
      {
      Date2 = new Date(Date1.setYear(Date1.getFullYear() + Addition))
    }
    return Date2
  }
    // 比较时间天数
  var GetDifDays = function (date1Str, date2Str) {
    res = 0
    var date1 = new Date(date1Str)
    var date2 = new Date(date2Str)
    if ((date1 instanceof Date) && (date2 instanceof Date)) {
      days = date1.getTime() - date2.getTime()
      res = parseInt(days / (1000 * 60 * 60 * 24))
    }
    return res
  }
    // 修改日期格式Date → yyyy-mm-dd
  var ChangeTimeForm = function (date) {
    var nowDay = ''
    if (date instanceof Date) {
      var mon = date.getMonth() + 1
      var day = date.getDate()
      nowDay = date.getFullYear() + '-' + (mon < 10 ? '0' + mon : mon) + '-' + (day < 10 ? '0' + day : day)
    }
    return nowDay
  }
  var dateNowStr = ChangeTimeForm(new Date())

   // 任务完成后设定下次任务执行时间
  var SetNextTime = function (LastDate, FreqTimes, Unit, Times) {
    var NextTime
    if ((Unit == '年') && (Times == 2))// 一年2次
        {
      Unit = '月'
      FreqTimes = 6
    }
    var tbl = {'周': 7, '月': 30, '年': 365}
    var someDays = tbl[Unit] * FreqTimes
    var days = GetDifDays(LastDate, dateNowStr)
    if (days > someDays) {
      NextTime = new Date(LastDate)
    } else {
      var add = FreqTimes
      if (Unit == '周') {
        add = FreqTimes * 7
      }
      NextTime = DateCalc(LastDate, Unit, add)
    }
        // console.log(NextTime);
    return NextTime
  }

    // 更新用户任务模板
  var UpdateUserTask = function (task) {
    var promise = Task.updateUserTask(task)
    promise.then(function (data) {
         // console.log(data);
      if (data.results) {
          // console.log(data.results);
      };
    }, function () {
    })
  }
    // 血透任务执行后处理
  var HemoTaskDone = function (task, flag) {
       // console.log(task);
    var dateStr = task.DateStr
    var StartArry = dateStr.split('+')[0].split(',')
    var Mediean = dateStr.split('+')[1]
    var EndArry = []
    var content
    if (dateStr.split('+')[2]) {
      EndArry = dateStr.split('+')[2].split(',')
    }
    var instructionArry = task.instruction.split('，')
    if (instructionArry.length > EndArry.length) // 判断是添加还是修改，修改不加次数
       {
      var newEnd = dateNowStr
      EndArry.push(newEnd)
      task.Progress = (Math.round(EndArry.length / task.times * 10000) / 100).toFixed(2) + '%' // 更新进度条
    }

    if (EndArry.length == task.times) {
      task.Flag = true
    }
    content = GetHemoStr(StartArry, Mediean, EndArry)

        // 更新任务完成时间

    task.endTime = EndArry.join(',')
    task.DateStr = GetHemoStr(StartArry, Mediean, EndArry)

        // 更新任务模板
    item = {
      'userId': UserId,
      'type': task.type,
      'code': task.code,
      'instruction': task.instruction,
      'content': task.DateStr,
      'startTime': '2050-11-02T07:58:51.718Z',
      'endTime': '2050-11-02T07:58:51.718Z',
      'times': task.times,
      'timesUnits': task.timesUnits,
      'frequencyTimes': task.frequencyTimes,
      'frequencyUnits': task.frequencyUnits
    }
    console.log(item)
    UpdateUserTask(item)
  }

  var OtherTaskDone = function (task, Description) {
    var NextTime = ''
    var item
        // var instructionStr = task.instruction;//避免修改模板 暂时就让它修改吧
    task.instruction = Description // 用于页面显示
    console.log('attention')
        // console.log(task);
    console.log(task.endTime)
    task.Flag = true
    task.endTime = task.endTime.substr(0, 10)
        // console.log(task.endTime);

    if (task.endTime != '2050-11-02T07:58:51.718Z') // 说明任务已经执行过
        {
      task.DoneFlag = true
    } else {
      task.DoneFlag = false
    }
    NextTime = ChangeTimeForm(SetNextTime(task.startTime, task.frequencyTimes, task.frequencyUnits, task.times))
    task.startTime = NextTime// 更改页面显示
        // console.log(dateNowStr);
    task.endTime = dateNowStr
        // console.log(task.endTime);

    item = {
      'userId': UserId,
      'type': task.type,
      'code': task.code,
      'instruction': task.instruction,
      'content': task.content,
      'startTime': NextTime,
      'endTime': task.endTime,
      'times': task.times,
      'timesUnits': task.timesUnits,
      'frequencyTimes': task.frequencyTimes,
      'frequencyUnits': task.frequencyUnits
    }
        // console.log(item);
    UpdateUserTask(item)  // 更改任务下次执行时间
  }
    // 插入任务执行情况
  this.Postcompliance_UpdateTaskStatus = function (task, otherTasks, healthID) {
         // console.log(otherTasks);
    var item = {
      'userId': UserId,
      'type': task.type,
      'code': task.code,
      'date': dateNowStr,
      'status': 0,
      'description': healthID
    }
        // console.log(item);
    var promise = Compliance.postcompliance(item)
    promise.then(function (data) {
            // console.log(data);
      if (data.results) {
        console.log(data.results)
        var Code = data.results.code
        var Description = data.results.description
        for (var i = 0; i < otherTasks.length; i++) {
          var task = otherTasks[i]
          if (task.code == Code) {
                        // console.log(task);
                        // console.log(otherTasks[i]);
            OtherTaskDone(task, Description)
            break
          }
        }
              // OtherTaskDone(data.results, data.results.description);
      }
    }, function () {
    })
  }
  return self
}])

.factory('DoctorService', ['$q', 'Patient', 'Storage', '$ionicPopup', '$state', '$ionicLoading', function ($q, Patient, Storage, $ionicPopup, $state, $ionicLoading) {
  var self = this
  /**
   * [申请医生为主管医生时，先查看主管医生服务状态：1、有主管医生；2、无主管医生但有申请；3、既无主管医生也无申请
   * 情况1删除主管医生后跳转；2等待已有申请审核后才可申请；3直接跳转]
   * @Author   PXY
   * @DateTime 2017-07-21
   * @param    Doctor：Object [前端医生卡片绑定的数据对象]
   */
  self.ifIHaveDoc = function (Doctor) {
    /**
     * [查看患者主管医生服务状态]
     * @Author   PXY
     * @DateTime 2017-07-24
     * @return   data:{message:String}
     */
    Patient.MyDocInCharge().then(function (data) {
      // debugger
      if (data.message === '已申请主管医生，请等待审核!') {
        $ionicPopup.alert({
          title: '请等待审核',
          template: '你已经申请了主管医生，在审核期间请耐心等待！在申请未被处理期间没有权限再次申请主管医生，敬请谅解！'
        })
      } else if (data.message === '当前已有主管医生!') {
        $ionicPopup.confirm({
          title: '删除主管医生',
          template: '你当前已有主管医生，是否需要删除当前的主管医生？后果将造成其剩余服务时间作废且款项不会返还，点击确认后将删除当前主管医生并进入申请其他医生页面。请谨慎！',
          buttons: [
            {text: '取消'},
            {text: '确认',
              onTap: function (e) {
              /**
              * [删除主管医生]
              * @Author   PXY
              * @DateTime 2017-07-24
              * @return   data:Object
              */
                Patient.CancelDocInCharge().then(function (data) {
                  $state.go('tab.applyDoctor', {applyDoc: Doctor})
                })
              }
            }
          ]
        })
      } else if (data.message === '当前无主管医生且无申请!') {
        $state.go('tab.applyDoctor', {applyDoc: Doctor})
      }
    }, function (err) {
    })
  }
  /**
   * [点击关注医生，关注成功后把医生设为已关注并提示]
   * @Author   PXY
   * @DateTime 2017-07-21
   * @param    Doctor：Object [前端医生卡片绑定的数据对象]
   */
  self.LikeDoctor = function (Doctor) {
    /**
     * [关注医生]
     * @Author   PXY
     * @DateTime 2017-07-24
     * @param    {doctorId：String,token:String}
     * @return   data:Object
     */
    Patient.FollowDoc({doctorId: Doctor.userId}).then(function (data) {
      Doctor.IsMyFollowDoctor = true  // 字段待协商
      $ionicLoading.show({
        template: '关注成功！',
        duration: 1000,
        hideOnStateChange: true
      })
    }, function (err) {

    })
  }
  /**
   * [点击取关医生，取关成功后把医生设为未关注并提示]
   * @Author   PXY
   * @DateTime 2017-07-24
   * @param   Doctor：Object [前端医生卡片绑定的数据对象]
   */
  self.DislikeDoctor = function (Doctor) {
    /**
     * [关注医生]
     * @Author   PXY
     * @DateTime 2017-07-24
     * @param    {doctorId：String,token:String}
     * @return   data:Object
     */
    Patient.UnFollowDoc({doctorId: Doctor.userId}).then(function (data) {
      Doctor.IsMyFollowDoctor = false
      $ionicLoading.show({
        template: '取关成功！',
        duration: 1000,
        hideOnStateChange: true
      })
    }, function (err) {

    })
  }
  /**
   * [点击删除主管医生，先弹窗提示确认后再删除]
   * @Author   PXY
   * @DateTime 2017-07-24
   */
  self.DeleteMyDoc = function () {
    var deferred = $q.defer()
    $ionicPopup.confirm({
      title: '删除主管医生',
      template: '你当前已有主管医生，是否需要删除当前的主管医生？后果将造成其剩余服务时间作废且款项不会返还，是否继续？',
      buttons: [
        {text: '取消',
          onTap: function (e) {
            deferred.reject('取消')
          }
        },
        {text: '继续',
          onTap: function (e) {
              /**
              * [删除主管医生]
              * @Author   PXY
              * @DateTime 2017-07-24
              * @return   data:Object
              */
            Patient.CancelDocInCharge().then(function (data) {
              deferred.resolve(data)
            }, function (err) {
              deferred.reject(err)
            })
          }
        }
      ]
    })
    return deferred.promise
  }
  return self
}])

.factory('User', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
        // phoneNo:"18768113669",
        // password:"123456",
        // role:"patient"
        // }
        // 000
  self.register = function (params) {
    var deferred = $q.defer()
    Data.User.register(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
        // phoneNo:"18768113669",
        // password:"123",
        // }
        // 001
  self.changePassword = function (params) {
    var deferred = $q.defer()
    Data.User.changePassword(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{
        // username:"18768113669",
        // password:"123456",
        // role:"patient"
        // }
        // 002
  self.logIn = function (params) {
    var deferred = $q.defer()
    Data.User.logIn(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{userId:"U201704010002"}
    // 003
  self.logOut = function (params) {
    var deferred = $q.defer()
    Data.User.logOut(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{phoneNo:"18768113668"}
    // 004
  self.getUserID = function (params) {
    var deferred = $q.defer()
    Data.User.getUserID(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{
        // mobile:"18768113660",
        // smsType:1}
    // 005
  self.sendSMS = function (params) {
    var deferred = $q.defer()
    Data.User.sendSMS(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{
        // mobile:"18868186038",
        // smsType:1
        // smsCode:234523}
    // 006
  self.verifySMS = function (params) {
    var deferred = $q.defer()
    Data.User.verifySMS(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{userId:"U201703310032"}
    // 036
  self.getAgree = function (params) {
    var deferred = $q.defer()
    Data.User.getAgree(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{userId:"U201703310032",agreement:"0"}
    // 037
  self.updateAgree = function (params) {
    var deferred = $q.defer()
    Data.User.updateAgree(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  // self.getUserIDbyOpenId = function (params) {
  //   var deferred = $q.defer()
  //   Data.User.getUserIDbyOpenId(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }

  self.setUnionId = function (params) {
    var deferred = $q.defer()
    Data.User.setUnionId(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.setOpenId = function (params) {
    var deferred = $q.defer()
    Data.User.setOpenId(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Health', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
        // userId:"U201704010003",
        // }
        // 011
  self.getAllHealths = function (params) {
    var deferred = $q.defer()
    Data.Health.getAllHealths(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
        // userId:"U201704010003",
        // insertTime:"2017-04-11T05:43:36.965Z",
        // }
        // 012
  self.getHealthDetail = function (params) {
    var deferred = $q.defer()
    Data.Health.getHealthDetail(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
        // userId:"U201704010003",
        // type:2,
        // time:"2014/02/22",
        // url:"c:/wf/img.jpg",
        // description:"晕厥入院，在医院住了3天，双侧颈动脉无异常搏动，双侧颈静脉怒张，肝颈静脉回流征阳性，气管居中，甲状腺不肿大，未触及结节无压痛、震颤，上下均为闻及血管杂音。",
        // }
        // 013
  self.createHealth = function (params) {
    var deferred = $q.defer()
    Data.Health.createHealth(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
        // userId:"U201704010003",
        // insertTime:"2017-04-11T05:43:36.965Z",
        // type:3,
        // time:"2014/02/22",
        // url:"c:/wf/img.jpg",
        // description:"修改晕厥入院，在医院住了3天，双侧颈动脉无异常搏动，双侧颈静脉怒张，肝颈静脉回流征阳性，气管居中，甲状腺不肿大，未触及结节无压痛、震颤，上下均为闻及血管杂音。",
        // }
        // 014
  self.modifyHealth = function (params) {
    var deferred = $q.defer()
    Data.Health.modifyHealth(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->{
        // userId:"U201704010003",
        // insertTime:"2017-04-11T05:43:36.965Z",
        // }
        // 015
  self.deleteHealth = function (params) {
    var deferred = $q.defer()
    Data.Health.deleteHealth(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  return self
}])

.factory('Measurement', ['$q', 'Data', function ($q, Data) {
  var self = this

  self.getPatientSign = function (params) {
    var deferred = $q.defer()
    Data.Measurement.getPatientSign(
               params,
               function (data, headers) {
                 deferred.resolve(data)
               },
               function (err) {
                 deferred.reject(err)
               })
    return deferred.promise
  }
  return self
}])

// .factory('Temp', ['$q', 'Data', function ($q, Data) {
//   var self = this

//   return self
// }])

.factory('Patient', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'p01'}
  self.getPatientDetail = function (params) {
    var deferred = $q.defer()
    Data.Patient.getPatientDetail(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->0:{userId:'p01'}
  self.getMyDoctors = function (params) {
    var deferred = $q.defer()
    Data.Patient.getMyDoctors(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->0:{workUnit:'浙江省人民医院'}
    //        1:{workUnit:'浙江省人民医院',name:'医生01'}
  self.getDoctorLists = function (params) {
    var deferred = $q.defer()
    Data.Patient.getDoctorLists(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->0:{userId:'p01'}
  self.getCounselRecords = function (params) {
    var deferred = $q.defer()
    Data.Patient.getCounselRecords(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->0:{
            //     patientId:'ppost01',
            //     doctorId:'doc01',
            //     diagname:'慢性肾炎',
            //     diagtime:'2017-04-06',
            //     diagprogress:'吃药',
            //     diagcontent:'blabla啥啥啥的'
            // }
    // self.insertDiagnosis = function(params){
    //     var deferred = $q.defer();
    //     Data.Patient.insertDiagnosis(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };

    // params->0:{
            //     userId:'ppost01',
            //     name:'患者xx',
            //     birthday:'1987-03-25',
            //     gender:2,
            //     IDNo:123456123456781234,
            //     height:183,
            //     weight:70,
            //     bloodType:2,
            //     class:'class1',
            //     class_info:'info_1',
            //     operationTime:'2017-04-05',
            //     hypertension:1,
            //     photoUrl:'http://photo/ppost01.jpg'
            // }
    // self.newPatientDetail = function(params){
    //     var deferred = $q.defer();
    //     Data.Patient.newPatientDetail(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };

    // params->0:{
                // userId:'ppost01',
                // name:'新名字2',
                // birthday:1987-03-03,
                // gender:1,
                // IDNo:123456123456781234,
                // height:183,
                // weight:70,
                // bloodType:2,
                // class:'class1',
                // class_info:'info3',
                // hypertension:1,
                // photoUrl:'http://photo/ppost01.jpg'
            // }
  self.editPatientDetail = function (params) {
    var deferred = $q.defer()
    Data.Patient.editPatientDetail(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  // self.bindingMyDoctor = function (params) {
  //   var deferred = $q.defer()
  //   Data.Patient.bindingMyDoctor(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
    // params->{
                // userId:'ppost01',
                // wechatPhotoUrl:'http://photo/ppost12.jpg',
            // }
  self.replacePhoto = function (params) {
    var deferred = $q.defer()
    Data.Patient.replacePhoto(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.ApplyDocInCharge = function (params) {
    var deferred = $q.defer()
    Data.Patient.ApplyDocInCharge(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  // params->{doctorId:'U201701040018',token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.FollowDoc = function (params) {
    var deferred = $q.defer()
    Data.Patient.FollowDoc(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  // params->{doctorId:'U201701040018',token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.UnFollowDoc = function (params) {
    var deferred = $q.defer()
    Data.Patient.UnFollowDoc(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  // params->{token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.MyDocInCharge = function (params) {
    var deferred = $q.defer()
    Data.Patient.MyDocInCharge(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

  // params->{token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ'}
  self.CancelDocInCharge = function (params) {
    var deferred = $q.defer()
    Data.Patient.CancelDocInCharge(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }

  self.getFollowDoctors = function (params) {
    var deferred = $q.defer()
    Data.Patient.getFollowDoctors(
               params,
               function (data, headers) {
                 deferred.resolve(data)
               },
               function (err) {
                 deferred.reject(err)
               })
    return deferred.promise
  }

  return self
}])

.factory('Mywechatphoto', ['$q', 'Data', function ($q, Data) {
  var self = this
  self.createTDCticket = function (params) {
    params.role = 'doctor'
    var deferred = $q.defer()
    Data.Mywechatphoto.createTDCticket(
              params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])
.factory('Doctor', ['$q', 'Data', function ($q, Data) {
  var self = this
  self.getDoctorInfo = function (params) {
    var deferred = $q.defer()
    Data.Doctor.getDoctorInfo(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Counsels', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'doc01',status:1}
    //        1:{userId:'doc01'}
    //        1:{userId:'doc01',type:1}
    //        1:{userId:'doc01',status:1,type:1}
  self.getCounsels = function (params) {
    var deferred = $q.defer()
    Data.Counsels.getCounsel(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->0:{
    //              counselId:'counselpost02',
    //              patientId:'p01',
    //              doctorId:'doc01',
    //              sickTime:'3天',
    //              symptom:'腹痛',
    //              symptomPhotoUrl:'http://photo/symptom1',
    //              help:'帮助'
    //          }
  self.questionaire = function (params) {
    var deferred = $q.defer()
    Data.Counsels.questionaire(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->0:{
    //              patientId:'p01',
    //              doctorId:'doc01',
    //              type:1//1->咨询 2->问诊
    //          }
  self.getStatus = function (params) {
    var deferred = $q.defer()
    Data.Counsels.getStatus(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->0:{
    //              patientId:'p01',
    //              doctorId:'doc01',
    //              type:1//1->咨询 2->问诊
    //          }
  // self.changeStatus = function (params) {
  //   var deferred = $q.defer()
  //   Data.Counsels.changeStatus(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
    // params->0:{
    //              patientId:'p01',
    //              doctorId:'doc01',
    //              type:1//1->咨询 2->问诊,3->咨询转问诊
    //          }
  self.changeType = function (params) {
    var deferred = $q.defer()
    Data.Counsels.changeType(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // insertCommentScore
  self.insertCommentScore = function (params) {
    var deferred = $q.defer()
    Data.Counsels.insertCommentScore(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Communication', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{counselId:'counsel01'}
  self.newConsultation = function (params) {
    var deferred = $q.defer()
    Data.Communication.newConsultation(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params-> messageType=2&id2=teamOrConsultation&limit=1&skip=0
    //         messageType=1&id1=doc&id2=pat&limit=1&skip=0
  self.getCommunication = function (params) {
    var deferred = $q.defer()
    Data.Communication.getCommunication(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    // params->0:{teamId:'team1'}
    // self.getTeam = function(params){
    //     var deferred = $q.defer();
    //     Data.Communication.getTeam(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };

    // params->0:{
            //      teamId:'teampost2',
            //      membersuserId:'id1',
            //      membersname:'name2'
            //  }
    // self.insertMember = function(params){
    //     var deferred = $q.defer();
    //     Data.Communication.insertMember(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };

    // params->0:{
            //      teamId:'teampost2',
            //      membersuserId:'id2'
            //  }
    // self.removeMember = function(params){
    //     var deferred = $q.defer();
    //     Data.Communication.removeMember(
    //         params,
    //         function(data, headers){
    //             deferred.resolve(data);
    //         },
    //         function(err){
    //             deferred.reject(err);
    //     });
    //     return deferred.promise;
    // };

  return self
}])
.factory('Message', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{type:1}
  self.getMessages = function (params) {
    var deferred = $q.defer()
    Data.Message.getMessages(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

    self.setMessagesRead = function (params) {
    var deferred = $q.defer()
    Data.Message.setMessagesRead(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Advice', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{type:1}
  self.postAdvice = function (params) {
    var deferred = $q.defer()
    Data.Advice.postAdvice(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('News', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{type:1}
  self.getNews = function (params) {
    var deferred = $q.defer()
    Data.News.getNews(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.insertNews = function (params) {
    var deferred = $q.defer()
    Data.News.insertNews(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.getNewsByReadOrNot = function (params) {
    var deferred = $q.defer()
    Data.News.getNewsByReadOrNot(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.setReadOrNot = function (params) {
    var deferred = $q.defer()
    Data.News.setReadOrNot(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    self.getNotRead = function (params) {
    var deferred = $q.defer()
    Data.News.getNotRead(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Account', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'p01'}
  // self.getAccountInfo = function (params) {
  //   var deferred = $q.defer()
  //   Data.Account.getAccountInfo(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
    // params->0:{
    //    patientId:'p01',
    //    doctorId:"doc01"
    // }
  self.getCounts = function (params) {
    var deferred = $q.defer()
    Data.Account.getCounts(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->0:{
    //    patientId:'p01',
    //    doctorId:"doc02",
    //    modify:-1
    // }
  self.modifyCounts = function (params) {
    var deferred = $q.defer()
    Data.Account.modifyCounts(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    //
  // self.rechargeDoctor = function (params) {
  //   var deferred = $q.defer()
  //   Data.Account.rechargeDoctor(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
    //
  self.updateFreeTime = function (params) {
    var deferred = $q.defer()
    Data.Account.updateFreeTime(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    //
  self.getCountsRespective = function (params) {
    var deferred = $q.defer()
    Data.Account.getCountsRespective(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])
.factory('VitalSign', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'p01',type:'type1'}
  self.getVitalSigns = function (params) {
    var deferred = $q.defer()
    Data.VitalSign.getVitalSigns(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.insertVitalSign = function (params) {
    var deferred = $q.defer()
    Data.VitalSign.insertVitalSign(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])
.factory('arrTool', function () {
  return {
    indexOf: function (arr, key, val, binary) {
      if (binary) {
                // 已排序，二分,用于消息
                // var first=0,last=arr.length,mid=(first+last)/2;
                // while(arr[mid][key]!=val){
                //     if(arr[mid])
                // }
      } else {
        for (var i = 0, len = arr.length; i < len; i++) {
          if (arr[i][key] == val) return i
        }
        return -1
      }
    }
  }
})
.factory('Comment', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'doc01'}
  // self.getComments = function (params) {
  //   var deferred = $q.defer()
  //   Data.Comment.getComments(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }
    // 根据counselid取comment zxf
  self.getCommentsByC = function (params) {
    var deferred = $q.defer()
    Data.Comment.getCommentsByC(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.getCommentsByDoc = function (params) {
    var deferred = $q.defer()
    Data.Comment.getCommentsByDoc(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])

.factory('Expense', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->0:{userId:'p01'}
  self.rechargeDoctor = function (params) {
    var deferred = $q.defer()
    Data.Expense.rechargeDoctor(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  return self
}])

.factory('Mywechat', ['$q', 'Data', function ($q, Data) {
  var self = this

  self.messageTemplate = function (params) {
    var deferred = $q.defer()
    Data.Mywechat.messageTemplate(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  // self.gettokenbycode = function (params) {
  //   var deferred = $q.defer()
  //   Data.Mywechat.gettokenbycode(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }

  self.addOrder = function (params) {
    var deferred = $q.defer()
    Data.Mywechat.addOrder(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  self.getUserInfo = function (params) {
    var deferred = $q.defer()
    Data.Mywechat.getUserInfo(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }

  return self
}])
.factory('mySocket', ['socket', '$interval', function (socket, $interval) {
  var timer = null
  var currentUser = {
    id: '',
    name: ''
  }
  function newUserOnce (userId, name) {
    if (userId == '') return
    var n = name || ''
    socket.emit('newUser', { user_name: n, user_id: userId, client: 'patient'})
    console.log('newuser')
  }
  return {
    newUser: function (userId, name) {
      socket.connect()
      currentUser.id = userId
      currentUser.name = name
      timer = $interval((function newuser () {
        newUserOnce(userId, name)
                // socket.emit('newUser',{ user_name:n , user_id: userId, client:'app'});
        return newuser
      }()), 600000)
    },
    newUserOnce: newUserOnce,
    newUserForTempUse: function (userId, name) {
      $interval.cancel(timer)
      newUserOnce(userId, name)
      return function () {
        socket.emit('disconnect')
        setTimeout(function () {
          newUser(currentUser.id, currentUser.name)
        }, 1000)
                // socket.emit('newUser',{ user_name:currentUser.name , user_id: currentUser.id, client:'app'});
      }
    },
    cancelAll: function () {
      if (timer != null) {
        $interval.cancel(timer)
        timers = null
      }
      currentUser.id = ''
    }
  }
}])
.factory('socket', ['$rootScope', 'socketFactory', 'CONFIG', function ($rootScope, socketFactory, CONFIG) {
  var myIoSocket = io.connect(CONFIG.socketServer + 'chat')
  // console.log(myIoSocket)
  var mySocket = socketFactory({
    ioSocket: myIoSocket,
    prefix: 'im:'
  })
  mySocket.forward(['getMsg', 'messageRes', 'err', 'disconnect'])
  return mySocket
}])
.factory('notify', ['$cordovaLocalNotification', '$cordovaFileTransfer', 'CONFIG', 'arrTool', function ($cordovaLocalNotification, $cordovaFileTransfer, CONFIG, arrTool) {
  var notices = {},
    iconPath = 'file://img/default_user.png',
    COUNT_REG = /^\[([1-9]+[0-9]*)\]/
  function getNote (msg) {
    console.log($cordovaLocalNotification.getAll())
  }
  function nextCount (text) {
    var matchs = text.match(COUNT_REG)
    return matchs === null ? 2 : Number(matchs[1]) + 1
  }
  function noteGen (msg) {
    var note = msg.fromName + ':',
      type = msg.contentType
    if (type == 'text') {
      note += msg.content.text
    } else if (type == 'image') {
      note += '[图片]'
    } else if (type == 'voice') {
      note += '[语音]'
    } else {
      var subT = msg.content.type
      if (subT == 'card') {
        if (msg.content.counsel.type == '1') tag1 = '[新咨询]'
        if (msg.content.counsel.type == '2' || msg.content.counsel.type == '3') tag1 = '[新问诊]'
        if (msg.content.counsel.type == '6' || msg.content.counsel.type == '7') tag1 = '[新加急咨询]'
        if (msg.newsType == '11') note += tag1
        else if (msg.newsType == '12') note += '[病历转发]'
        else note += '[团队病历]'
      } else if (subT == 'contact') {
        note += '[联系人名片]'
      } else if (subT == 'endl') {
        if (msg.content.counseltype == 1) tag2 = '[咨询结束]'
        if (msg.content.counseltype == 2 || msg.content.counseltype == 3) tag2 = '[问诊结束]'
        if (msg.content.counseltype == 6 || msg.content.counseltype == 7) tag2 = '[加急咨询结束]'
        note += tag2
      } else {
        note += '[新消息]'
      }
    }
    return note
  }
  function schedulNote (msg, note) {
    if (note) {
      note.text = '[' + nextCount(note.text) + ']' + noteGen(msg)
            // opt.text = '[' + nextCount(note.text) + ']' + opt.text;
    } else {
      var noteid = msg.targetType == 'single' ? msg.fromID : msg.targetID
      noteid = Number(noteid.slice(1))
      var note = {
        id: noteid,
        title: msg.targetType == 'single' ? msg.fromName : msg.targetName,
        text: noteGen(msg),
        data: msg,
        led: '1199dd',
        icon: '',
        smallIcon: 'texticon',
        color: '1199dd'
      }
    }
    return $cordovaLocalNotification.schedule(note)
  }
  return {
    add: function (msg) {
      if (msg.contentType == 'custom' && (msg.content.type == 'counsel-upgrade' || msg.content.type == 'count-notice')) return

      var matchId = msg.targetType == 'single' ? msg.fromID : msg.targetID
      matchId = Number(matchId.slice(1))
      return $cordovaLocalNotification.getAll()
                .then(function (notes) {
                  var pos = arrTool.indexOf(notes, 'id', matchId)
                  if (pos == -1) return null
                  return notes[pos]
                }).then(function (note) {
                  if (note == null) {
                    return schedulNote(msg)
                  } else {
                    return schedulNote(msg, note)
                  }
                })
    },
    remove: function (id) {
      var matchId = Number(id.slice(1))
      return $cordovaLocalNotification.cancel(matchId)
    }
  }
}])

.factory('insurance', ['$q', 'Data', function ($q, Data) {
  var self = this
    // params->{
            //  url:'patient_class'
           // }
  self.setPrefer = function (params) {
    var deferred = $q.defer()
    Data.insurance.setPrefer(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
    // params->{
            //  code:'3'
            // }
  // self.getPrefer = function (params) {
  //   var deferred = $q.defer()
  //   Data.insurance.getPrefer(
  //           params,
  //           function (data, headers) {
  //             deferred.resolve(data)
  //           },
  //           function (err) {
  //             deferred.reject(err)
  //           })
  //   return deferred.promise
  // }

  return self
}])
.factory('session', ['Storage', 'socket', 'mySocket', '$ionicHistory', function (Storage, socket, mySocket, $ionicHistory) {
  return {
    logOut: function () {
      Storage.rm('TOKEN')
      var USERNAME = Storage.get('USERNAME')
      Storage.clear()
      Storage.set('isSignIN', 'No')
      Storage.set('USERNAME', USERNAME)
      mySocket.cancelAll()
      socket.emit('disconnect')
      socket.disconnect()
      $ionicHistory.clearCache()
      $ionicHistory.clearHistory()
    }
  }
}])
.factory('QandC', ['$q', 'Order', '$http', 'Storage', '$ionicLoading', '$state', '$ionicPopup', '$ionicHistory', 'Counsels', 'Account', 'CONFIG', 'Expense', 'socket', 'Mywechat', function ($q, Order, $http, Storage, $ionicLoading, $state, $ionicPopup, $ionicHistory, Counsels, Account, CONFIG, Expense, socket, Mywechat) {
  self = this
  var ionicLoadingshow = function () {
    $ionicLoading.show({
      template: '加载中...',
      hideOnStateChange: true
    })
  }
  var ionicLoadingShowError = function () {
    $ionicLoading.show({
      template: '网络跑远了，请重试！',
      duration: 1500
    })
  }
  var ionicLoadinghide = function () {
    $ionicLoading.hide()
  }
  /**
   * [根据咨询的类型值返回中文]
   * @Author   PXY
   * @DateTime 2017-08-02
   * @param    consultType:number 只接受1,2,3,6,7
   * @return   String
   */
  var whichconsultType = function (consultType) {
    var name = ''
    switch (consultType) {
      case 1:
        name = '咨询'
        break
      case 2: case 3:
        name = '问诊'
        break
      case 6: case 7:
        name = '加急咨询'
        break
    }
    return name
  }

  self.consultable = 1
  var whichTemplate = {
    '1': {
      counselType: 1,
      counselTemplate: '您上次付费的咨询尚未新建成功，点击确认继续填写完善上次的咨询问卷，进入咨询后，根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，24小时后本次咨询关闭。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。'
    },
    '2': {
      counselType: 2,
      counselTemplate: '您上次付费的问诊尚未新建成功，点击确认继续填写完善上次的咨询问卷，进入问诊后，您询问该医生的次数不限，最后由医生结束此次问诊，请尽量详细描述病情和需求。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。'
    },
    '6': {
      counselType: 6,
      counselTemplate: '您上次付费的加急咨询尚未新建成功，点击确认继续填写完善上次的咨询问卷，进入咨询后，根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，2小时后本次咨询关闭。医生会在2小时内回答，如超过2小时医生未作答，本次咨询关闭，且不收取费用。'
    }
  }

  self.question = function (DoctorId, charge1) {
    /**
   * *[获取用户当前咨询相关的信息，是否正在进行]
   * @Author   ZXF
   * @DateTime 2017-07-05
   * @doctorId    {[string]}用户咨询医生id
   * @patientId    {[string]}
   * @return   {[type]}status==1 有正在进行的咨询或者问诊 直接进咨询界面
   */
    Counsels.getStatus({doctorId: DoctorId, patientId: Storage.get('UID')}).then(function (data) {
      // zxf 判断条件重写
      if (data.result != '请填写咨询问卷!' && data.result.status == 1) {
        // 有尚未完成的咨询或者问诊
        if (self.consultable == 1 && data.result.type) {
          self.consultable = 0
          var consultName = whichconsultType(data.result.type)
          $ionicPopup.confirm({
            title: '咨询确认',
            template: '您有尚未结束的' + consultName + '，点击确认继续上一次' + consultName + '！',
            okText: '确认',
            cancelText: '取消'
          }).then(function (res) {
            if (res) {
              $state.go('consult-chat', {chatId: DoctorId})
            }
            self.consultable = 1
          })
        }
      } else {
        // 没有进行中的问诊咨询 查看是否已经付过费
        // console.log("fj;akfmasdfzjl")
        /**
         * *[没有正在进行的咨询，判断用户是否有已付费未提交的咨询：有已付钱但尚未新建的问诊，进入咨询问卷，返回data.results[0].type对应已付费的咨询类型
         * @Author   ZXF
         * @DateTime 2017-07-05
         * @param    {[type]}
         * @return   {[type]}
         */
        Order.PaidUnfinishedOrders({doctorId: DoctorId}).then(function (data) {
          // debugger
          if (self.consultable === 1) {
            if (data.msg != 'nonexistence') {
              // console.log('nonexistence')
              self.consultable = 0

              $ionicPopup.confirm({
                title: '咨询确认',
                template: whichTemplate[data.results[0].type].counselTemplate,
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  // console.log(whichTemplate[data.result.count].counselType)
                  $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: whichTemplate[data.results[0].type].counselType})
                }
                self.consultable = 1
              })
            } else {
              // console.log('account')
              Account.getCounts({patientId: Storage.get('UID'), doctorId: DoctorId}).then(function (succ) {
                if (succ.result.freeTimes > 0) {
                  self.consultable = 0
                  $ionicPopup.confirm({
                    title: '咨询确认',
                    template: '您还有剩余免费咨询次数，进入咨询后，根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，24小时后本次咨询关闭。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不耗费免费咨询次数。点击确认进入免费咨询。',
                    okText: '确认',
                    cancelText: '取消'
                  }).then(function (res) {
                    self.consultable = 1
                    if (res) {
                      var neworder = {
                        'doctorId': DoctorId,
                          // freeFlag为1表示免费
                        'freeFlag': 1,
                        'type': 1,
                          // 咨询类型为1
                        'userId': Storage.get('UID'),

                        'role': 'appPatient',
                          // 微信支付以分为单位
                        'money': charge1 * 100,
                        'class': '01',
                        'name': '咨询',
                        'notes': DoctorId,
                        'trade_type': 'APP',
                        'body_description': '咨询服务'
                      }
                      /**
                       * *[后台根据order下订单，生成拉起微信支付所需的参数,results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信]
                       * @Author   PXY
                       * @DateTime 2017-07-20
                       * @param    neworder：Object
                       * @return   orderdata:Object
                       */
                      Mywechat.addOrder(neworder).then(function (orderdata) {
                      // 免费咨询次数减一 count+3
                      /**
                       * *[免费咨询次数减一]
                       * @Author   ZXF
                       * @DateTime 2017-07-05
                       * @patientId    {[string]}
                       * @return   {[type]}
                       */
                        Account.updateFreeTime({patientId: Storage.get('UID')}).then(function (data) {
                        /**
                         * *[修改患者咨询问诊过程能够询问的次数]count=3表示咨询 count=999表示问诊
                         * @Author   ZXF
                         * @DateTime 2017-07-05
                         * @patientId    {[string]}
                         * @doctorId    {[string]}
                         * @modify    {[int]}
                         * @return   {[type]}
                         */
                          $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 1})
                        }, function (err) {
                          console.log(err)
                        })
                      }, function (err) {
                        console.log(err)
                      })
                    }
                  })
                } else {
                  self.consultable = 0
                  $ionicPopup.confirm({// 没有免费也没有回答次数 交钱 充值 加次数
                    title: '咨询确认',
                    template: '进入咨询后，根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，24小时后本次咨询关闭。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。是否确认付费？',
                    okText: '确认',
                    cancelText: '取消'
                  }).then(function (res) {
                    self.consultable = 1
                    if (res) {
                      ionicLoadingshow()
                      var neworder = {
                        'doctorId': DoctorId,
                    // freeFlag为1表示免费
                        'freeFlag': 0,
                        'type': 1,
                    // 咨询类型为1
                        'userId': Storage.get('UID'),
                        'role': 'appPatient',
                    // 微信支付以分为单位
                        'money': charge1 * 100,
                        'class': '01',
                        'name': '咨询',
                        'notes': DoctorId,
                        'trade_type': 'APP',
                        'body_description': '咨询服务'
                      }
                  /**
                   * *[后台根据order下订单，生成拉起微信支付所需的参数]
                   * @Author   ZXF
                   * @DateTime 2017-07-05
                   * @return   {[type]}results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信，else拉起微信
                   */
                      Mywechat.addOrder(neworder).then(function (orderdata) {
                        if (orderdata.results.status === 1) {
                          ionicLoadinghide()
                    // if (orderdata.results.status === 0) {
                          $ionicLoading.show({
                            template: orderdata.results.msg,
                            duration: 1000,
                            hideOnStateChange: true
                          })
                    // }

                          $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 1})
                        } else {
                          ionicLoadinghide()
                          var params = {
                            'partnerid': '1480817392', // merchant id
                            'prepayid': orderdata.results.prepay_id[0], // prepay id
                            'noncestr': orderdata.results.nonceStr, // nonce
                            'timestamp': orderdata.results.timestamp, // timestamp
                            'sign': orderdata.results.paySign // signed string
                          }
                          // alert(JSON.stringify(params));
                          /**
                           * *[微信jssdk方法，拉起微信支付]
                           * @Author   ZXF
                           * @DateTime 2017-07-05
                           * @partnerid    {[type]}
                           * @prepayid    {[type]}
                           * @noncestr    {[type]}
                           * @timestamp    {[type]}
                           * @sign       {[type]}
                           * @return   {[type]}
                           */
                          Wechat.sendPaymentRequest(params, function () {
                          // alert("Success");
                            ionicLoadingshow()
                            $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 1})
                          }, function (reason) {
                            if (reason == '发送请求失败') {
                              $ionicLoading.show({
                                template: '请正确安装微信后使用此功能',
                                duration: 1000
                              })
                            } else {
                              $ionicLoading.show({
                                template: reason,
                                duration: 1000
                              })
                            }
                          })
                        }
                      }, function (err) {
                        ionicLoadinghide()
                        console.log(err)
                      })
                    }
                  })
                }
              })
            }
          }
        })
        // 分界线在此！！！！！！！！
      }
    }, function (err) {
      console.log(err)
    })
  }
  self.consult = function (DoctorId, charge1, charge2) {
   /**
   * *[获取用户当前咨询相关的信息，是否正在进行]
   * @Author   ZXF
   * @DateTime 2017-07-05
   * @doctorId    {[string]}用户咨询医生id
   * @patientId    {[string]}
   * @return   {[type]}status==1 有正在进行的咨询或者问诊 直接进咨询界面
   */
    Counsels.getStatus({doctorId: DoctorId, patientId: Storage.get('UID')}).then(function (data) {
        // zxf 判断条件重写
      // debugger
      console.log(data)
      if (self.consultable == 1) {
        self.consultable = 0
        if (data.result != '请填写咨询问卷!' && data.result.status == 1) { // 有尚未完成的咨询或者问诊
          if (data.result.type == 1) { // 咨询转问诊
            $ionicPopup.confirm({
              title: '问诊确认',
              template: '您有尚未结束的咨询，补齐差价可升级为问诊，问诊将在升级后24小时自动结束或者由医生结束，问诊中询问医生的次数不限。确认付费升级为问诊？',
              okText: '确认',
              cancelText: '取消'
            }).then(function (res) {
              self.consultable = 1
              if (res) {
                ionicLoadingshow()
                var neworder = {
                  'doctorId': DoctorId,
                    // freeFlag为1表示免费
                  'freeFlag': 0,
                  'type': 3,
                    // 咨询类型为1
                  'userId': Storage.get('UID'),
                  'role': 'appPatient',
                    // 微信支付以分为单位
                  'money': charge2 * 100 - charge1 * 100,
                  'class': '03',
                  'name': '咨询升级问诊',
                  'notes': DoctorId,
                  'trade_type': 'APP',
                  'body_description': '咨询升级问诊服务'
                }
                /**
                 * *[后台根据order下订单，生成拉起微信支付所需的参数]
                 * @Author   ZXF
                 * @DateTime 2017-07-05
                 * @return   {[type]}results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信，else拉起微信
                 */
                Mywechat.addOrder(neworder).then(function (orderdata) {
                  if (orderdata.results.status === 1) {
                    ionicLoadinghide()
                    // if (orderdata.results.status === 0) {
                    $ionicLoading.show({
                      template: orderdata.results.msg,
                      duration: 1000,
                      hideOnStateChange: true
                    })
                    // }
                    /**
                     * *[用户选择将咨询升级成问诊是调用方法，将咨询的type从1（咨询）转为3（问诊）]
                     * @Author   ZXF
                     * @DateTime 2017-07-05
                     * @doctorId    {[string]}
                     * @patientId    {[string]}
                     * @type    {[int]}只能是1
                     * @changeType    {[bool]}
                     * @return   {[type]}
                     */
                    Counsels.changeType({doctorId: DoctorId, patientId: Storage.get('UID'), type: 1, status: 1, changeType: 'type3'}).then(function (data) {
                      // alert('changeType' + JSON.stringify(data))
                          // console.log(data)
                      var msgJson = {
                        clientType: 'app',
                        contentType: 'custom',
                        fromName: '',
                        fromID: Storage.get('UID'),
                        fromUser: {
                          avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + Storage.get('UID') + '_myAvatar.jpg'
                        },
                        targetID: DoctorId,
                        targetName: '',
                        targetType: 'single',
                        status: 'send_going',
                        createTimeInMillis: Date.now(),
                        newsType: '11',
                        targetRole: 'doctor',
                        content: {
                          type: 'counsel-upgrade',
                          flag: 'consult'
                        }
                      }
                      socket.emit('newUser', {user_name: Storage.get('UID'), user_id: Storage.get('UID'), client: 'patient'})
                      socket.emit('message', {msg: msgJson, to: DoctorId, role: 'patient'})
                      $state.go('consult-chat', {chatId: DoctorId})
                    }, function (err) {

                    })
                  } else {
                    ionicLoadinghide()
                    var params = {
                      'partnerid': '1480817392', // merchant id
                      'prepayid': orderdata.results.prepay_id[0], // prepay id
                      'noncestr': orderdata.results.nonceStr, // nonce
                      'timestamp': orderdata.results.timestamp, // timestamp
                      'sign': orderdata.results.paySign // signed string
                    }
                    Wechat.sendPaymentRequest(params, function () {
                      /**
                     * *[用户选择将咨询升级成问诊是调用方法，将咨询的type从1（咨询）转为3（问诊）]
                     * @Author   ZXF
                     * @DateTime 2017-07-05
                     * @doctorId    {[string]}
                     * @patientId    {[string]}
                     * @type    {[int]}只能是1
                     * @changeType    {[bool]}
                     * @return   {[type]}
                     */
                      ionicLoadingshow()
                      Counsels.changeType({doctorId: DoctorId, patientId: Storage.get('UID'), type: 1, status: 1, changeType: 'type3'}).then(function (data) {
                        // alert('changeType' + JSON.stringify(data))
                        var msgJson = {
                          clientType: 'app',
                          contentType: 'custom',
                          fromName: '',
                          fromID: Storage.get('UID'),
                          fromUser: {
                            avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + Storage.get('UID') + '_myAvatar.jpg'
                          },
                          targetID: DoctorId,
                          targetName: '',
                          targetType: 'single',
                          status: 'send_going',
                          createTimeInMillis: Date.now(),
                          newsType: '11',
                          targetRole: 'doctor',
                          content: {
                            type: 'counsel-upgrade',
                            flag: 'consult'
                          }
                        }
                        socket.emit('newUser', {user_name: Storage.get('UID'), user_id: Storage.get('UID'), client: 'patient'})
                        socket.emit('message', {msg: msgJson, to: DoctorId, role: 'patient'})
                        $state.go('consult-chat', {chatId: DoctorId})
                      }, function (err) {
                        ionicLoadingShowError()
                        console.log(err)
                      })
                    }, function (reason) {
                      if (reason == '发送请求失败') {
                        $ionicLoading.show({
                          template: '请正确安装微信后使用此功能',
                          duration: 1000
                        })
                      } else {
                        $ionicLoading.show({
                          template: reason,
                          duration: 1000
                        })
                      }
                    })
                  }
                })
              }
            })
          } else {
            var consultName = whichconsultType(data.result.type)
            $ionicPopup.confirm({
              title: '咨询确认',
              template: '您有尚未结束的' + consultName + '，点击确认继续上一次' + consultName + '！',
              okText: '确认',
              cancelText: '取消'
            }).then(function (res) {
              if (res) {
                $state.go('consult-chat', {chatId: DoctorId})
              }
              self.consultable = 1
            })
          }
        } else {
          /**
         * *[没有正在进行的咨询，判断用户是否有已付费未提交的咨询：有已付钱但尚未新建的问诊，进入咨询问卷，返回data.results[0].type对应已付费的咨询类型
         * @Author   ZXF
         * @DateTime 2017-07-05
         * @param    {[type]}
         * @return   {[type]}
         */
          Order.PaidUnfinishedOrders({doctorId: DoctorId}).then(function (succ) {
            if (succ.msg != 'nonexistence') {
              $ionicPopup.confirm({
                title: '咨询确认',
                template: whichTemplate[succ.results[0].type].counselTemplate,
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  // console.log(whichTemplate[data.result.count].counselType)
                  $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: whichTemplate[succ.results[0].type].counselType})
                }
                self.consultable = 1
              })
            } else {
              // self.consultable = 0
              $ionicPopup.confirm({// 没有免费也没有回答次数 交钱 充值 加次数
                title: '咨询确认',
                template: '进入问诊后，您询问该医生的次数不限，最后由医生结束此次问诊，请尽量详细描述病情和需求。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。是否确认付费?',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                self.consultable = 1
                if (res) {
                  ionicLoadingshow()
                  var neworder = {
                    'doctorId': DoctorId,
                    // freeFlag为1表示免费
                    'freeFlag': 0,
                    'type': 2,
                    // 问诊类型为2
                    'userId': Storage.get('UID'),
                    'role': 'appPatient',
                    // 微信支付以分为单位
                    'money': charge2 * 100,
                    'class': '02',
                    'name': '问诊',
                    'notes': DoctorId,
                    'trade_type': 'APP',
                    'body_description': '问诊服务'
                  }
                  /**
                   * *[后台根据order下订单，生成拉起微信支付所需的参数]
                   * @Author   ZXF
                   * @DateTime 2017-07-05
                   * @return   {[type]}results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信，else拉起微信
                   */
                  Mywechat.addOrder(neworder).then(function (orderdata) {
                    if (orderdata.results.status === 1) {
                      ionicLoadinghide()
                      // if (orderdata.results.status === 0) {
                      $ionicLoading.show({
                        template: orderdata.results.msg,
                        duration: 1000,
                        hideOnStateChange: true
                      })
                      // }

                        // console.log(data)
                      $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 2})
                    } else {
                      ionicLoadinghide()
                      var params = {
                        'partnerid': '1480817392', // merchant id
                        'prepayid': orderdata.results.prepay_id[0], // prepay id
                        'noncestr': orderdata.results.nonceStr, // nonce
                        'timestamp': orderdata.results.timestamp, // timestamp
                        'sign': orderdata.results.paySign // signed string
                      }
                          // alert(JSON.stringify(params));
                          /**
                           * *[微信jssdk方法，拉起微信支付]
                           * @Author   ZXF
                           * @DateTime 2017-07-05
                           * @partnerid    {[type]}
                           * @prepayid    {[type]}
                           * @noncestr    {[type]}
                           * @timestamp    {[type]}
                           * @sign       {[type]}
                           * @return   {[type]}
                           */
                      Wechat.sendPaymentRequest(params, function () {
                          // alert("Success");
                        ionicLoadingshow()

                        $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 2})
                      }, function (reason) {
                        if (reason == '发送请求失败') {
                          $ionicLoading.show({
                            template: '请正确安装微信后使用此功能',
                            duration: 1000
                          })
                        } else {
                          $ionicLoading.show({
                            template: reason,
                            duration: 1000
                          })
                        }
                      })
                    }
                  }, function (err) {
                    ionicLoadinghide()
                    console.log(err)
                  })
                }
              })
            }
          })
        }
      }
    }, function (err) {
      console.log(err)
    })
  }
  self.urgentquestion = function (DoctorId, charge1, charge3) {
   /**
   * *[获取用户当前咨询相关的信息，是否正在进行]
   * @Author   ZXF
   * @DateTime 2017-07-05
   * @doctorId    {[string]}用户咨询医生id
   * @patientId    {[string]}
   * @return   {[type]}status==1 有正在进行的咨询或者问诊 直接进咨询界面
   */
    Counsels.getStatus({doctorId: DoctorId, patientId: Storage.get('UID')}).then(function (data) {
      // alert(121212)
      // zxf 判断条件重写
      // debugger
      if (self.consultable == 1) {
        self.consultable = 0
        if (data.result != '请填写咨询问卷!' && data.result.status == 1) {
          // 有尚未完成的咨询或者问诊
          if (data.result.type == 1) { // 咨询转加急咨询
            $ionicPopup.confirm({
              title: '问诊确认',
              template: '您有尚未结束的咨询，补齐差价可升级为加急咨询，升级为加急咨询后医生会在2小时内回答，如超过2小时医生未作答，本次咨询关闭，且不收取费用。确认付费升级为加急咨询？',
              okText: '确认',
              cancelText: '取消'
            }).then(function (res) {
              self.consultable = 1
              if (res) {
                ionicLoadingshow()
                var neworder = {
                  'doctorId': DoctorId,
                    // freeFlag为1表示免费
                  'freeFlag': 0,
                  'type': 7,
                    // 咨询类型为1
                  'userId': Storage.get('UID'),
                  'role': 'appPatient',
                    // 微信支付以分为单位
                  'money': charge3 * 100 - charge1 * 100,
                  'class': '07',
                  'name': '咨询升级加急咨询',
                  'notes': DoctorId,
                  'trade_type': 'APP',
                  'body_description': '咨询升级加急咨询服务'
                }
                /**
                 * *[后台根据order下订单，生成拉起微信支付所需的参数]
                 * @Author   ZXF
                 * @DateTime 2017-07-05
                 * @return   {[type]}results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信，else拉起微信
                 */
                // console.log(charge3 * 100 - charge1 * 100)
                Mywechat.addOrder(neworder).then(function (orderdata) {
                  if (orderdata.results.status === 1) {
                    ionicLoadinghide()
                    // if (orderdata.results.status === 0) {
                    $ionicLoading.show({
                      template: orderdata.results.msg,
                      hideOnStateChange: true
                    })
                    // }
                    /**
                     * *[用户选择将咨询升级成问诊是调用方法，将咨询的type从1（咨询）转为3（问诊）]
                     * @Author   ZXF
                     * @DateTime 2017-07-05
                     * @doctorId    {[string]}
                     * @patientId    {[string]}
                     * @type    {[int]}只能是1
                     * @changeType    {[bool]}
                     * @return   {[type]}
                     */
                    Counsels.changeType({doctorId: DoctorId, patientId: Storage.get('UID'), type: 1, status: 1, changeType: 'type7'}).then(function (data) {
                      // alert('changeType' + JSON.stringify(data))
                      var msgJson = {
                        clientType: 'app',
                        contentType: 'custom',
                        fromName: '',
                        fromID: Storage.get('UID'),
                        fromUser: {
                          avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + Storage.get('UID') + '_myAvatar.jpg'
                        },
                        targetID: DoctorId,
                        targetName: '',
                        targetType: 'single',
                        status: 'send_going',
                        createTimeInMillis: Date.now(),
                        newsType: '11',
                        targetRole: 'doctor',
                        content: {
                          type: 'counsel-upgrade',
                          flag: 'urgent'
                        }
                      }
                      socket.emit('newUser', {user_name: Storage.get('UID'), user_id: Storage.get('UID'), client: 'patient'})
                      socket.emit('message', {msg: msgJson, to: DoctorId, role: 'patient'})
                      $state.go('consult-chat', {chatId: DoctorId})
                    }, function (err) {
                      ionicLoadingShowError()
                    })
                  } else {
                    ionicLoadinghide()
                    var params = {
                      'partnerid': '1480817392', // merchant id
                      'prepayid': orderdata.results.prepay_id[0], // prepay id
                      'noncestr': orderdata.results.nonceStr, // nonce
                      'timestamp': orderdata.results.timestamp, // timestamp
                      'sign': orderdata.results.paySign // signed string
                    }
                    Wechat.sendPaymentRequest(params, function () {
                      /**
                     * *[用户选择将咨询升级成问诊是调用方法，将咨询的type从1（咨询）转为3（问诊）]
                     * @Author   ZXF
                     * @DateTime 2017-07-05
                     * @doctorId    {[string]}
                     * @patientId    {[string]}
                     * @type    {[int]}只能是1
                     * @changeType    {[bool]}
                     * @return   {[type]}
                     */
                      ionicLoadingshow()
                      Counsels.changeType({doctorId: DoctorId, patientId: Storage.get('UID'), type: 1, status: 1, changeType: 'type7'}).then(function (data) {
                        // alert('changeType' + JSON.stringify(data))
                        var msgJson = {
                          clientType: 'app',
                          contentType: 'custom',
                          fromName: '',
                          fromID: Storage.get('UID'),
                          fromUser: {
                            avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + Storage.get('UID') + '_myAvatar.jpg'
                          },
                          targetID: DoctorId,
                          targetName: '',
                          targetType: 'single',
                          status: 'send_going',
                          createTimeInMillis: Date.now(),
                          newsType: '11',
                          targetRole: 'doctor',
                          content: {
                            type: 'counsel-upgrade',
                            flag: 'urgent'
                          }
                        }
                        socket.emit('newUser', {user_name: Storage.get('UID'), user_id: Storage.get('UID'), client: 'patient'})
                        socket.emit('message', {msg: msgJson, to: DoctorId, role: 'patient'})

                        $state.go('consult-chat', {chatId: DoctorId})
                      }, function (err) {
                        // alert('changeTypeERROR' + JSON.stringify(data))
                        ionicLoadingShowError()
                        console.log(err)
                      })
                    }, function (reason) {
                      if (reason == '发送请求失败') {
                        $ionicLoading.show({
                          template: '请正确安装微信后使用此功能',
                          duration: 1000
                        })
                      } else {
                        $ionicLoading.show({
                          template: reason,
                          duration: 1000
                        })
                      }
                    })
                  }
                }, function (err) {
                  ionicLoadinghide()
                  console.log('addOrder' + err)
                })
              }
            })
          } else {
            var consultName = whichconsultType(data.result.type)
            $ionicPopup.confirm({
              title: '咨询确认',
              template: '您有尚未结束的' + consultName + '，点击确认继续上一次' + consultName + '！',
              okText: '确认',
              cancelText: '取消'
            }).then(function (res) {
              if (res) {
                $state.go('consult-chat', {chatId: DoctorId})
              }
              self.consultable = 1
            })
          }
        } else {
          /**
         * *[没有正在进行的咨询，判断用户是否有已付费未提交的咨询：有已付钱但尚未新建的问诊，进入咨询问卷，返回data.results[0].type对应已付费的咨询类型
         * @Author   ZXF
         * @DateTime 2017-07-05
         * @param    {[type]}
         * @return   {[type]}
         */
          Order.PaidUnfinishedOrders({doctorId: DoctorId}).then(function (succ) {
            if (succ.msg != 'nonexistence') {
              $ionicPopup.confirm({
                title: '咨询确认',
                template: whichTemplate[succ.results[0].type].counselTemplate,
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  // console.log(whichTemplate[data.result.count].counselType)
                  $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: whichTemplate[succ.results[0].type].counselType})
                }
                self.consultable = 1
              })
            } else {
              // self.consultable = 0
              $ionicPopup.confirm({// 没有免费也没有回答次数 交钱 充值 加次数
                title: '咨询确认',
                template: '进入加急咨询后，根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，2小时后本次咨询关闭。医生会在2小时内回答，如超过2小时医生未作答，本次咨询关闭，且不收取费用。是否确认付费？',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                self.consultable = 1
                if (res) {
                  ionicLoadingshow()
                  var neworder = {
                    'doctorId': DoctorId,
                    // freeFlag为1表示免费
                    'freeFlag': 0,
                    'type': 6,
                    // 加急咨询类型为6
                    'userId': Storage.get('UID'),
                    'role': 'appPatient',
                    // 微信支付以分为单位
                    'money': charge3 * 100,
                    'class': '06',
                    'name': '加急咨询',
                    'notes': DoctorId,
                    'trade_type': 'APP',
                    'body_description': '加急咨询服务'
                  }
                  /**
                   * *[后台根据order下订单，生成拉起微信支付所需的参数]
                   * @Author   ZXF
                   * @DateTime 2017-07-05
                   * @return   {[type]}results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信，else拉起微信
                   */
                  console.log('加急咨询付费')
                  Mywechat.addOrder(neworder).then(function (orderdata) {
                    if (orderdata.results.status === 1) {
                      ionicLoadinghide()
                      // if (orderdata.results.status === 0) {
                      $ionicLoading.show({
                        template: orderdata.results.msg,
                        hideOnStateChange: true
                      })
                      // }
                      /**
                       * *[修改患者咨询问诊过程能够询问的次数]count=3表示咨询 count=999表示问诊
                       * @Author   ZXF
                       * @DateTime 2017-07-05
                       * @patientId    {[string]}
                       * @doctorId    {[string]}
                       * @modify    {[int]}
                       * @return   {[type]}
                       */
                        // console.log(data)
                      $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 6})
                    } else {
                      ionicLoadinghide()
                      var params = {
                        'partnerid': '1480817392', // merchant id
                        'prepayid': orderdata.results.prepay_id[0], // prepay id
                        'noncestr': orderdata.results.nonceStr, // nonce
                        'timestamp': orderdata.results.timestamp, // timestamp
                        'sign': orderdata.results.paySign // signed string
                      }
                        // alert(JSON.stringify(params));
                        /**
                         * *[微信jssdk方法，拉起微信支付]
                         * @Author   ZXF
                         * @DateTime 2017-07-05
                         * @partnerid    {[type]}
                         * @prepayid    {[type]}
                         * @noncestr    {[type]}
                         * @timestamp    {[type]}
                         * @sign       {[type]}
                         * @return   {[type]}
                         */
                      Wechat.sendPaymentRequest(params, function () {
                          // alert("Success");
                      /**
                       * *[修改患者咨询问诊过程能够询问的次数]count=3表示咨询 count=999表示问诊
                       * @Author   ZXF
                       * @DateTime 2017-07-05
                       * @patientId    {[string]}
                       * @doctorId    {[string]}
                       * @modify    {[int]}
                       * @return   {[type]}
                       */
                        ionicLoadingshow()
                        $state.go('tab.consultQuestionnaire', {DoctorId: DoctorId, counselType: 6})
                      }, function (reason) {
                        if (reason == '发送请求失败') {
                          $ionicLoading.show({
                            template: '请正确安装微信后使用此功能',
                            duration: 1000
                          })
                        } else {
                          $ionicLoading.show({
                            template: reason,
                            duration: 1000
                          })
                        }
                      })
                    }
                  }, function (err) {
                    ionicLoadinghide()
                    console.log(err)
                  })
                }
              })
            }
          })
        }
      }
    }, function (err) {
      console.log(err)
    })
  }
  return self
}])

.factory('Authentication', ['jwtHelper', 'CONFIG', 'Storage', '$q', function (jwtHelper, CONFIG, Storage, $q) {
  var self = this
  this.check = function () {
    var token = Storage.get('TOKEN')
    // var refreshToken = Storage.get('refreshToken')
    var isExpired = true

    if (token) {
      try {
          /*
           * 由于jwt自带的过期判断方法与服务器端使用的加密方法不匹配，使用jwthelper解码的方法对token进行解码后自行判断token是否过期
           */
            // isExpired = jwtHelper.isTokenExpired(token);
        var temp = jwtHelper.decodeToken(token)
        if (temp.exp === 'undefined') {
          isExpired = false
        } else {
              // var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
              // d.setUTCSeconds(temp.expireAfter);
          isExpired = !(temp.exp > new Date().valueOf())// (new Date().valueOf() - 8*3600*1000));
              // console.log(temp)
        }

             // console.log(isExpired);
      } catch (e) {
        console.log(e)
        isExpired = true
      }
    }
    // console.log(!isExpired)
    return !isExpired
  }
  return self
}])
.factory('Forum', ['$q', 'Data', function ($q, Data) {
  var self = this
  self.allposts = function (params) {
    var deferred = $q.defer()
    Data.Forum.allposts(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.myposts = function (params) {
    var deferred = $q.defer()
    Data.Forum.myposts(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.mycollection = function (params) {
    var deferred = $q.defer()
    Data.Forum.mycollection(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            }
        )
    return deferred.promise
  }
  self.newpost = function (params) {
    var deferred = $q.defer()
    Data.Forum.newpost(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.favorite = function (params) {
    var deferred = $q.defer()
    Data.Forum.favorite(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.deletefavorite = function (params) {
    var deferred = $q.defer()
    Data.Forum.deletefavorite(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.deletepost = function (params) {
    var deferred = $q.defer()
    Data.Forum.deletepost(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.postcontent = function (params) {
    var deferred = $q.defer()
    Data.Forum.postcontent(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.deletecomment = function (params) {
    var deferred = $q.defer()
    Data.Forum.deletecomment(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.comment = function (params) {
    var deferred = $q.defer()
    Data.Forum.comment(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  self.reply = function (params) {
    var deferred = $q.defer()
    Data.Forum.reply(
            params,
            function (data, headers) {
              deferred.resolve(data)
            },
            function (err) {
              deferred.reject(err)
            })
    return deferred.promise
  }
  return self
}])
