angular.module('kidney.controllers', ['ionic', 'kidney.services', 'ngResource', 'ionic-datepicker', 'kidney.directives'])//, 'ngRoute'

.controller('SignInCtrl', ['$ionicLoading', '$scope', '$timeout', '$state', 'Storage', '$ionicHistory', 'Data', 'User', '$sce', 'Mywechat', 'Patient', 'mySocket', '$ionicPopup', function ($ionicLoading, $scope, $timeout, $state, Storage, $ionicHistory, Data, User, $sce, Mywechat, Patient, mySocket, $ionicPopup) {
  /**
   * [从本地存储中取手机号码USERNAME,如果有则显示在登录页面，无则显示空]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  if (Storage.get('USERNAME') != null && Storage.get('USERNAME') != undefined) {
    $scope.logOn = {username: Storage.get('USERNAME'), password: ''}
  } else {
        // alert('USERNAME null')
    $scope.logOn = {username: '', password: ''}
  }

  

  /**
   * [手机号码和密码输入后点击登录:1、登录失败（账号密码不对，网络问题）；2、登录成功:2.1签过协议则跳转主页，2.2没签过则跳转协议页面]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    logOn:{username:String, password:String}  注：username手机号码
   */
  $scope.signIn = function (logOn) {
    $scope.logStatus = ''
    if ((logOn.username != '') && (logOn.password != '')) {
      var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
            // 手机正则表达式验证
      if (!phoneReg.test(logOn.username)) {
        $scope.logStatus = '手机号验证失败！'
      } else {
        Storage.set('USERNAME', logOn.username)
        /**
         * [登录]
         * @Author   PXY
         * @DateTime 2017-07-04
         * @param    {username（手机号）:String, password:String,role:String} 注：患者登录role写死 'patient'
         * @return  data:（1、成功登录）{results: {status:Number,userId:String,userName:String,lastlogin:Date,mesg:String,token:String,refreshToken:String}}
         *               （2、账号密码错误）{results:Number,mesg:String}
         *          err
         */
        $ionicLoading.show({
          template:'<ion-spinner icon="ios"></ion-spinner>',
          hideOnStateChange:true
        })
        User.logIn({username: logOn.username, password: logOn.password, role: 'patient'}).then(function (data) {
           // console.log(data)
          $ionicLoading.hide()
          if (data.results == 1) {
            if (data.mesg == "Alluser doesn't Exist!" || data.mesg == 'No authority!') {
              $scope.logStatus = '账号不存在！'
            } else if (data.mesg == "Alluser password isn't correct!") {
              $scope.logStatus = '账号或密码错误！'
            }
          } else if (data.results.mesg == 'login success!') {
            $scope.logStatus = '登录成功！'
            $ionicHistory.clearCache()
            $ionicHistory.clearHistory()
            Storage.set('TOKEN', data.results.token)
            Storage.set('UID', data.results.userId)
            Storage.set('refreshToken', data.results.refreshToken)
                        // Storage.set('UName',data.results.userName);
                        // 如果姓名不为空就发送姓名，否则直接发送id
            var name = data.results.userName ? data.results.userName : data.results.userId
            mySocket.newUser(data.results.userId, name)
            /**
             * [获取用户签署协议状态,agreement为0为签过协议，跳转主页；为1则没签过协议，跳转协议页面]
             * @Author   PXY
             * @DateTime 2017-07-04
             * @param    userId:String
             * @return   res:{result:{agreement: String}}
             *           err
             */
            User.getAgree({userId: data.results.userId,role:'patient'}).then(function (res) {
              if (res.results.agreementPat == '0') {
                $timeout(function () { $state.go('tab.tasklist') }, 500)
              } else {
                $timeout(function () { $state.go('agreement', {delay: true}) }, 500)
              }
            }, function (err) {
              $ionicLoading.hide()
              $scope.logStatus = '网络错误！'
            })

          }
        }, function (err) {
            $ionicLoading.hide()
            $scope.logStatus = '网络错误！'
            return
         
        })
      }
    } else {
      $scope.logStatus = '请输入完整信息！'
    }
  }

  var ionicLoadingshow = function () {
    $ionicLoading.show({
      template: '登录中...'
    })
  }
  var ionicLoadinghide = function () {
    $ionicLoading.hide()
  }

  /**
   * [点击注册,跳转获取验证码页面，传递参数register表示注册流程]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  $scope.toRegister = function () {
    $state.go('registerPat',{rType:'phone'})
  }
  /**
   * [点击重置密码,跳转获取验证码页面，传递参数reset表示重置密码流程]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  $scope.toReset = function () {
    $state.go('phonevalid')
  }

  $scope.bindwechat = function () 
  {
    $ionicPopup.show({   
      title: '将您的微信账号与手机账号进行绑定，绑定后在公众号内可以自动登录',
      buttons: [
        { 
          text: '取消',
          type: 'button'
        },
        {
          text: '確定',
          type: 'button-positive',
          onTap: function(e) {
              $state.go('bindwechat')
          }
        }
      ]
    })
  }
/**
 * *[微信登录点击，获取用户unionid，以及个人基本信息]
 * @Author   ZXF
 * @DateTime 2017-07-05
 * @return   {[type]}
 */
  // $scope.wxsignIn = function () {
  //   $ionicLoading.show({

  //     template: '<ion-spinner icon="ios"></ion-spinner>',
  //     hideOnStateChange:true
  //   })
  //   /**
  //    * *[微信js版sdk自带方法，微信登录，获取用户授权之后拿到用户的基本信息]
  //    * @Author   ZXF
  //    * @DateTime 2017-07-05
  //    * @param    {[type]}
  //    * @param    {[type]}
  //    * @return   code:string
  //    */
  //   var wxscope = 'snsapi_userinfo',
  //   wxstate = '_' + (+new Date())
  //   Wechat.auth(wxscope, wxstate, function (response) {
  //       // you may use response.code to get the access token.
  //       // $ionicLoading.hide()
  //       // alert(JSON.stringify(response))
  //       // alert(response.code);
  //       /**
  //        * *[根据unionid获取用户基本信息]
  //        * @Author   ZXF
  //        * @DateTime 2017-07-05
  //        * @param    {role: 'appPatient',code:string,state:?}
  //        * @param    {[type]}
  //        * @return   results:{headimgurl：微信头像路径，unionid：string，}
  //        */
  //     Mywechat.getUserInfo({role: 'appPatient', code: response.code, state: ''}).then(function (persondata) {
  //         // alert('getUserInfo:'+JSON.stringify(persondata));
  //       Storage.set('wechatheadimgurl', persondata.results.headimgurl)
  //       Storage.set('openId',persondata.results.openid)
  //       $scope.unionid = persondata.results.unionid
  //         // alert('unionid:'+$scope.unionid)
  //         // 判断这个unionid是否已经绑定用户了 有直接登录
  //         /**
  //          * *[根据unionid获取用户userid]
  //          * @Author   ZXF
  //          * @DateTime 2017-07-05
  //          * @param    {['username': unionid]}
  //          * @return   {results：[0:用户有与微信unionid绑定userid]，UserId：string，roles:['patient','doctor'...]用户所用的角色}
  //          */
  //       User.getUserID({'username': $scope.unionid}).then(function (ret) {
  //           // alert('userId:'+JSON.stringify(ret))
  //           // 用户已经存在id 说明公众号注册过
  //           // 未测试
  //           /**
  //            * *[将用户的微信头像存在用户表中，如果用户没有头像存，有则不修改]
  //            * @Author   ZXF
  //            * @DateTime 2017-07-05
  //            * @param    {[patientId：string，wechatPhotoUrl：微信头像路径]}
  //            * @return   {[type]}
  //            */
  //         if (Storage.get('wechatheadimgurl') && ret.results === 0) {
  //               // alert("image"+ret.AlluserId+Storage.get('wechatheadimgurl')); 
  //           Patient.replacePhoto({'patientId': ret.AlluserId, 'wechatPhotoUrl': Storage.get('wechatheadimgurl')}).then(function (data) {
  //             // alert(JSON.stringify(data))
  //             Storage.rm('wechatheadimgurl')
  //           }, function (err) {
  //             // alert('imageerror'+JSON.stringify(err))
  //             // console.log(err)
  //           }
  //               )
  //               // 已有头像，未更新;没有头像，已替换
  //         }

  //         if (ret.results == 0 && ret.roles.indexOf('patient') != -1) { // 直接登录
  //           ionicLoadingshow()
  //           /**
  //            * [用户的unionid登录，密码不能为空可以随意填写]
  //            * @Author   ZXF
  //            * @DateTime 2017-07-05
  //            * @param    logOn:{username:String, password:String，role：string}  注：username：unionid
  //            */
  //           User.logIn({username: $scope.unionid, password: '112233', role: 'patient'}).then(function (data) {
  //               // alert("sername:$scope.unionid,password:112"+JSON.stringify(data));
  //             if (data.results.mesg == 'login success!') {
  //               Storage.set('UID', data.results.userId)// 后续页面必要uid

  //               Storage.set('patientunionid', $scope.unionid)// 自动登录使用
  //               Storage.set('TOKEN', data.results.token)// token作用目前还不明确

  //               Storage.set('refreshToken', data.results.refreshToken)

  //               mySocket.newUser(data.results.userId)
  //               ionicLoadinghide()
  //               $state.go('tab.tasklist')
                
  //             }
  //           }, function (er) {
  //               // alert(JSON.stringify(er))
  //             ionicLoadinghide()
  //           })
  //         } else {
  //               // alert('else');
  //           Storage.set('patientunionid', $scope.unionid)// 自动登录使用
  //           $state.go('registerPat',{rType:'openId'})
  //         }
  //       })
  //     }, function (err) {
  //         // alert(JSON.stringify(err));
  //     })
  //   }, function (reason) {
  //     $ionicLoading.show({
  //       template: reason,
  //       duration: 1000
  //     })
  //   })
  // // }

  //   // }
  // }
}])

.controller('AgreeCtrl', ['$ionicLoading','$stateParams', '$scope', '$timeout', '$state', 'Storage', '$ionicHistory', '$http',  'User', '$ionicPopup', 'mySocket', function ($ionicLoading,$stateParams, $scope, $timeout, $state, Storage, $ionicHistory, $http, User, $ionicPopup, mySocket) {
  var ionicLoadingshow = function(){
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>', 
      hideOnStateChange:true  
    })
  }
  /**
   * [点击同意协议，如果是登录补签协议则更新协议状态后跳转主页；如果是注册则更新协议状态后跳转设置密码]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  $scope.YesIdo = function () { 
    var last = $ionicHistory.backView().stateName
    // 分为三种情况：1、导入用户补签：（1.1手机号码登录；1.2微信注册）；2、手机号注册
    if($stateParams.delay && last === 'signin'){
      // 手机号码登录后补签协议，则签完协议去首页
      User.updateAgree({userId: Storage.get('UID'), agreement: '0',role:'patient'}).then(function (data) {
        if (data.results != null) {
          $timeout(function () { $state.go('tab.tasklist') }, 500)
        } else {
          console.log('用户不存在!')
        }
      }, function (err) {
        console.log(err)
      })
    }else if($stateParams.delay && last === 'registerPat'){
      // 微信注册补签协议，则登录和签协议后去首页
      ionicLoadingshow()
      User.logIn({username: Storage.get('patientunionid'), password: '112233', role: 'patient'}).then(function (succ) {
        // alert("userlogin"+JSON.stringify(succ))
        if (succ.results.mesg == 'login success!') {
          Storage.set('UID', succ.results.userId)// 后续页面必要uid
          Storage.set('TOKEN', succ.results.token)// token作用目前还不明确
          Storage.set('refreshToken', succ.results.refreshToken)
          mySocket.newUser(succ.results.userId)
          User.updateAgree({userId: Storage.get('UID'), agreement: '0',role:'patient'}).then(function (data) {
            $ionicLoading.hide()
            if (data.results != null) {
              $ionicPopup.show({
                title: '微信账号绑定手机账号成功，您的初始密码是123456，您以后也可以用手机号码登录！',
                buttons: [
                  {
                    text: '確定',
                    type: 'button-positive',
                    onTap: function (e) {
                      $state.go('tab.tasklist')
                    }
                  }
                ]
              })
            } else {
              console.log('用户不存在!')
            }
          }, function (err) {
            $ionicLoading.hide()
            console.log(err)
          })
         
        }
      },function(err){
        $ionicLoading.hide()
      })
    }else{
      // 手机号码注册，把签协议的勾勾上
      Storage.set('agreement','yes')
      $ionicHistory.goBack()
    }
  }
}])
.controller('registerCtrl', ['mySocket','$interval','$timeout','$ionicLoading','$stateParams', '$scope', '$timeout', '$state', 'Storage','User','$ionicHistory','$q','Patient',  function (mySocket,$interval,$timeout,$ionicLoading,$stateParams, $scope, $timeout, $state, Storage,User,$ionicHistory,$q,Patient) {
  $scope.veritext = '获取验证码'
  $scope.isable = false
  $scope.Register = {}

  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.wechat = $stateParams.rType === 'openId' ? true : false
    if(!$scope.Register.agree){
     $scope.Register.agree = Storage.get('agreement') === "yes" ? true : false
    }
  })

  $scope.goBack = function(){
    if(Storage.get('agreement')){
      Storage.rm('agreement')
    }
    $ionicHistory.goBack()
  }

  $scope.changeAgree = function(agree){
    if(!agree&&Storage.get('agreement')){
      Storage.rm('agreement')
    }
  }
  /**
   * [disable获取验证码按钮1分钟，并改变获取验证码按钮显示的文字]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  var unablebutton = function () {
     // 验证码BUTTON效果
    $scope.isable = true
    $scope.veritext = '60s'
    var time = 59
    var timer
    timer = $interval(function () {
      if (time == 0) {
        $interval.cancel(timer)
        timer = undefined
        $scope.veritext = '获取验证码'
        $scope.isable = false
      } else {
        $scope.veritext = time + 's'
        time--
      }
    }, 1000)
  }

   /**
   * [发送验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    phone:String
   */
  var sendSMS = function (phone,count) {
    /**
     * [发送验证码,disable按钮一分钟，并根据服务器返回提示用户]
     * @Author   PXY
     * @DateTime 2017-07-04
     * @param    {mobile:String,smsType:Number}  注：写死 1
     * @return   data:{results:Number,mesg:String} 注：results为0为成功发送
     *           err
     */
    
    User.sendSMS({mobile: phone, smsType: 1}).then(function (data) {
      unablebutton()
      if (data.results == 1) {
        $scope.logStatus = '验证码发送失败！'
      } else if (data.mesg.substr(0, 8) == '您的邀请码已发送'){
        $scope.logStatus = '您的验证码已发送，重新获取请稍后'
      } else {
        $scope.logStatus = '验证码发送成功！'
      }
    }, function (err) {
      count++
      console.log(count)
      if (count < 5) {
        setTimeout(sendSMS(phone, count), 1000)
      } else {
        $scope.logStatus = '验证码发送失败！'
      }
    })
  }

  var ionicLoadingshow = function(){
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>', 
      hideOnStateChange:true  
    })
  }
  $scope.registerMode = null
  /**
   * [点击获取验证码，如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    Verify:{Phone:String,Code:String} 注：Code没用到
   */
  $scope.getcode = function () { 
    console.log($scope.Register.Phone)
    $scope.logStatus = ''
   
    if ($scope.Register.Phone == '') {
      $scope.logStatus = '手机号码不能为空！'
      return
    }
    var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
        // 手机正则表达式验证
    if (!phoneReg.test($scope.Register.Phone)) {
      $scope.logStatus = '手机号验证失败！'
      return
    }


    
    User.getUserID({username: $scope.Register.Phone}).then(function (data) {
      // alert('getUserID:'+ JSON.stringify(data))
      // 如果是手机号码注册则未注册账号才发验证码
      if($stateParams.rType === 'phone'){
        if (data.results == 0 && data.roles.toString().indexOf('patient')>-1) {
          $scope.logStatus = '该账户已注册！'
        }else{
          sendSMS($scope.Register.Phone,0)
        }
      }
      // 如果是微信号注册则分为三种：1：未注册手机号；2：已注册非导入用户（已签协议）；3：导入用户（未签协议）
      else if($stateParams.rType === 'openId'){
        if (data.results == 0 && data.roles.toString().indexOf('patient')>-1) {
          Storage.set('UID',data.AlluserId)
          User.getAgree({userId: data.AlluserId,role:'patient'}).then(function (res) {
            sendSMS($scope.Register.Phone,0)
            if (res.results.agreementPat == '0') {
              //签过协议
              $scope.registerMode = 'wechatSigned'
            } else {
              $scope.registerMode = 'wechatImported'
            }
          }, function (err) {
            $scope.logStatus = '网络错误！'
          })
          
        }else{
          $scope.registerMode = 'wechatUnsigned'
          sendSMS($scope.Register.Phone,0)
        }
      }
      
    }, function () {
      $scope.logStatus = '连接超时！'
    })
  }
  $scope.goAgreement = function(){
    $state.go('agreement')
  }

  $scope.wechatPhone = function(phoneNum,phoneCode){
    var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
    $scope.logStatus = ''
    if(phoneReg.test(phoneNum)){
      if(phoneCode){
        ionicLoadingshow()

        User.verifySMS({mobile: phoneNum, smsType: 1, smsCode:phoneCode}).then(function (data) {
          // alert('verifySMS'+JSON.stringify(data))
          // alert('registerMode'+$scope.registerMode)
          if(data.results == 0){
            Storage.set('USERNAME',phoneNum)

            if($scope.registerMode === 'wechatUnsigned'){
              // 如果是未注册用户的微信登录，则还需填写密码和姓名（moreWechat动态显示需填写内容）
              $scope.moreWechat = true
              $ionicLoading.hide()
            }else if($scope.registerMode === 'wechatSigned'){
              // 如果是已注册但未绑定微信用户的微信登录，则直接绑定微信并登录
              $q.all([
                User.setUnionId({phoneNo:phoneNum,openId:Storage.get('patientunionid')}),
                User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
              ]).then(function(res){
                // alert('setUnionId'+JSON.stringify(res))
                if (Storage.get('wechatheadimgurl')) {
                  // alert("image"+ret.AlluserId+Storage.get('wechatheadimgurl')); 
                  Patient.replacePhoto({'patientId': Storage.get('UID'), 'wechatPhotoUrl': Storage.get('wechatheadimgurl')}).then(function (res) {
                  // alert(JSON.stringify(data))
                    Storage.rm('wechatheadimgurl')
                  }, function (err) {
                  // alert('imageerror'+JSON.stringify(err))
                    console.log(err)
                  })
                // 已有头像，未更新;没有头像，已替换
                }
                User.logIn({username: Storage.get('patientunionid'), password: '112233', role: 'patient'}).then(function (succ) {
                  // alert("userlogin"+JSON.stringify(succ))
                  if (succ.results.mesg == 'login success!') {
                    Storage.set('UID', succ.results.userId)// 后续页面必要uid
                    Storage.set('TOKEN', succ.results.token)// token作用目前还不明确
                    Storage.set('refreshToken', succ.results.refreshToken)
                    $state.go('tab.tasklist')
                    mySocket.newUser(succ.results.userId)
                    
                  }
                },function(err){
                  $ionicLoading.hide()
                })
              },function(err){
                $ionicLoading.hide()
              })
            }else if( $scope.registerMode === 'wechatImported'){
              // 如果是导入用户（已注册，未绑定微信但没签协议），则绑定微信后去签协议
              $q.all([
                User.setUnionId({phoneNo:phoneNum,openId:Storage.get('patientunionid')}),
                User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
              ]).then(function(res){
                // alert('setUnionId'+JSON.stringify(res))
                if (Storage.get('wechatheadimgurl')) {
                  // alert("image"+ret.AlluserId+Storage.get('wechatheadimgurl')); 
                  Patient.replacePhoto({'patientId': Storage.get('UID'), 'wechatPhotoUrl': Storage.get('wechatheadimgurl')}).then(function (res) {
                  // alert(JSON.stringify(data))
                    Storage.rm('wechatheadimgurl')
                  }, function (err) {
                  // alert('imageerror'+JSON.stringify(err))
                    console.log(err)
                  })
                // 已有头像，未更新;没有头像，已替换
                }
                $state.go('agreement',{delay:true})
              },function(err){
                $ionicLoading.hide()
              })
            }
          }else{
            $scope.logStatus = data.mesg
            $ionicLoading.hide()
          }
        },function(err){
          $scope.logStatus = JSON.stringify(err)
          $ionicLoading.hide()
        })
      }else{
        $scope.logStatus = '验证码不能为空！'
      }
    }else{
      $scope.logStatus = '手机号验证失败！'
    }
  }
  $scope.phoneRegister = function(register){ 
    // 结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
    var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
    $scope.logStatus = ''
    if($stateParams.rType === 'phone'){
      if(phoneReg.test(register.Phone)){
        if(register.Code){
          if(register.newPass === register.confirm){
            /**
             * [验证手机号码]
             * @Author   PXY
             * @DateTime 2017-07-04
             * @param    {mobile:String,smsType:Number,smsCode:String} 注：smsType写死1
             * @return   data:{results:Number,mesg:String}  注：results为0代表验证成功
             *           err
             */
            ionicLoadingshow()
            
            User.verifySMS({mobile: register.Phone, smsType: 1, smsCode:register.Code}).then(function (data) {
              if (data.results == 0) {
                User.register({phoneNo:register.Phone,password:register.confirm,name:register.name,role:'patient'}).then(function(res){
                  Storage.set('UID',res.userNo)
                  Storage.set('USERNAME',register.Phone)
                  User.updateAgree({userId:res.userNo,agreement:'0',role:'patient'}).then(function(succ){
                    $ionicLoading.hide()
                    $ionicLoading.show({
                      template:"恭喜您，注册成功！",
                      duration:1000
                    })
                    $timeout(function(){$state.go('signin')},1000)
                    if(Storage.get('agreement')){
                      Storage.rm('agreement')
                    }
                  },function(err){
                    $ionicLoading.hide()
                  })
                  
                },function(err){
                  $ionicLoading.hide()
                })
                
              } else {
                $ionicLoading.hide()
                $scope.logStatus = data.mesg
              }
            }, function () {
              $ionicLoading.hide()
              $scope.logStatus = '连接超时！'
            })
          }else{
            $scope.logStatus = '密码输入不一致！'
          }
        }else{
          $scope.logStatus = '验证码不能为空！'
        }
      }else{
        $scope.logStatus = '手机号验证失败！'
      }
    }

    
       
  }

  $scope.wxRegister = function(register){
    // alert('register参数是'+JSON.stringify(register))
      if(register.newPass === register.confirm){
        ionicLoadingshow()
        User.register({phoneNo:register.Phone,password:register.confirm,name:register.name,role:'patient'}).then(function(res){
          Storage.set('UID',res.userNo)
          Storage.set('USERNAME',register.Phone)
          $q.all([
            User.updateAgree({userId:res.userNo,agreement:'0',role:'patient'}),
            User.setUnionId({phoneNo:register.Phone,openId:Storage.get('patientunionid')}),
            //type为4是指患者app端，若为微信则要改为2
            User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
          ]).then(function(succ){
            // alert('$Q返回' + JSON.stringify(succ))
            $ionicLoading.hide()
            $ionicLoading.show({
              template:"恭喜您，注册成功！正在登录，请稍后。",
              hideOnStateChange:true
            })
            if (Storage.get('wechatheadimgurl')) {
              // alert("image"+ret.AlluserId+Storage.get('wechatheadimgurl')); 
              Patient.replacePhoto({'patientId': Storage.get('UID'), 'wechatPhotoUrl': Storage.get('wechatheadimgurl')}).then(function (res) {
              // alert(JSON.stringify(data))
                Storage.rm('wechatheadimgurl')
              }, function (err) {
              // alert('imageerror'+JSON.stringify(err))
                console.log(err)
              })
            // 已有头像，未更新;没有头像，已替换
            }
            User.logIn({username: Storage.get('patientunionid'), password: '112233', role: 'patient'}).then(function(data){
              // alert("userlogin"+JSON.stringify(data))
              if (data.results.mesg == 'login success!') {
                Storage.set('UID', data.results.userId)// 后续页面必要uid
                Storage.set('TOKEN', data.results.token)// token作用目前还不明确
                Storage.set('refreshToken', data.results.refreshToken)
                mySocket.newUser(data.results.userId)
                $state.go('tab.tasklist')
                if(Storage.get('agreement')){
                  Storage.rm('agreement')
                }
              }
            },function(err){
              $ionicLoading.hide()
              $scope.logStatus = JSON.stringify(err)
            })
            
            
          },function(err){
            $ionicLoading.hide()
          })
          
        },function(err){
          $ionicLoading.hide()
        })
            
        
      }else{
        $scope.logStatus = '密码输入不一致！'
      }
  }
  

}])
// 忘记密码--手机号码验证--PXY 这个好像跟registerCTRL一样
// .controller('phonevalidCtrl', ['$scope', '$state', '$interval', '$stateParams', 'Storage', 'User',  function ($scope, $state, $interval, $stateParams, Storage, User) {
//   // Storage.set("personalinfobackstate","register")

//   $scope.Verify = {Phone: '', Code: ''}
//   $scope.veritext = '获取验证码'
//   $scope.isable = false
//   $scope.Register = {}

//   $scope.$on('$ionicView.beforeEnter', function () {
//     $scope.wechat = $stateParams.rType === 'openId' ? true : false
//     if(!$scope.Register.agree){
//      $scope.Register.agree = Storage.get('agreement') === "yes" ? true : false
//     }
//   })

//   $scope.goBack = function(){
//     if(Storage.get('agreement')){
//       Storage.rm('agreement')
//     }
//     $ionicHistory.goBack()
//   }

//   $scope.changeAgree = function(agree){
//     if(!agree&&Storage.get('agreement')){
//       Storage.rm('agreement')
//     }
//   }
//   /**
//    * [disable获取验证码按钮1分钟，并改变获取验证码按钮显示的文字]
//    * @Author   PXY
//    * @DateTime 2017-07-04
//    */
//   var unablebutton = function () {
//      // 验证码BUTTON效果
//     $scope.isable = true
//     $scope.veritext = '60s'
//     var time = 59
//     var timer
//     timer = $interval(function () {
//       if (time == 0) {
//         $interval.cancel(timer)
//         timer = undefined
//         $scope.veritext = '获取验证码'
//         $scope.isable = false
//       } else {
//         $scope.veritext = time + 's'
//         time--
//       }
//     }, 1000)
//   }

//    /**
//    * [发送验证码]
//    * @Author   PXY
//    * @DateTime 2017-07-04
//    * @param    phone:String
//    */
//   var sendSMS = function (phone,count) {
//     /**
//      * [发送验证码,disable按钮一分钟，并根据服务器返回提示用户]
//      * @Author   PXY
//      * @DateTime 2017-07-04
//      * @param    {mobile:String,smsType:Number}  注：写死 1
//      * @return   data:{results:Number,mesg:String} 注：results为0为成功发送
//      *           err
//      */
    
//     User.sendSMS({mobile: phone, smsType: 1}).then(function (data) {
//       unablebutton()
//       if (data.results == 0) {
//         if (data.mesg.substr(0, 8) == '您的邀请码已发送') {
//           $scope.logStatus = '您的验证码已发送，重新获取请稍后'
//         } else {
//           $scope.logStatus = '验证码发送成功！'
//         }
//       } else {
//         $scope.logStatus = '验证码发送失败，请稍后再试'
//       }
//     }, function (err) {
//       count++
//       console.log(count)
//       if (count < 5) {
//         setTimeout(sendSMS(phone, count), 1000)
//       } else {
//         $scope.logStatus = '验证码发送失败！'
//       }
//     })
//   }

//   var ionicLoadingshow = function(){
//     $ionicLoading.show({
//       template: '<ion-spinner icon="ios"></ion-spinner>', 
//       hideOnStateChange:true  
//     })
//   }
//   $scope.registerMode = null

//   /**
//    * [点击获取验证码，如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码]
//    * @Author   PXY
//    * @DateTime 2017-07-04
//    * @param    Verify:{Phone:String,Code:String} 注：Code没用到
//    */

//   $scope.getcode = function () { 
//     console.log($scope.Register.Phone)
//     $scope.logStatus = ''
   
//     if ($scope.Register.Phone == '') {

//       $scope.logStatus = '手机号码不能为空！'
//       return
//     }
//     var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
//         // 手机正则表达式验证
//     if (!phoneReg.test($scope.Register.Phone)) {
//       $scope.logStatus = '手机号验证失败！'
//       return
//     }


    

//     User.getUserID({username: $scope.Register.Phone}).then(function (data) {
//       // alert('getUserID:'+ JSON.stringify(data))
//       // 如果是手机号码注册则未注册账号才发验证码
//       if($stateParams.rType === 'phone'){
//         if (data.results == 0 && data.roles.toString().indexOf('patient')>-1) {
//           $scope.logStatus = '该账户已注册！'
//         }else{
//           sendSMS($scope.Register.Phone,0)
//         }
//       }
//       // 如果是微信号注册则分为三种：1：未注册手机号；2：已注册非导入用户（已签协议）；3：导入用户（未签协议）
//       else if($stateParams.rType === 'openId'){
//         if (data.results == 0 && data.roles.toString().indexOf('patient')>-1) {
//           Storage.set('UID',data.AlluserId)
//           User.getAgree({userId: data.AlluserId,role:'patient'}).then(function (res) {
//             sendSMS($scope.Register.Phone,0)
//             if (res.results.agreementPat == '0') {
//               //签过协议
//               $scope.registerMode = 'wechatSigned'
//             } else {
//               $scope.registerMode = 'wechatImported'
//             }
//           }, function (err) {
//             $scope.logStatus = '网络错误！'
//           })
          
//         }else{
//           $scope.registerMode = 'wechatUnsigned'
//           sendSMS($scope.Register.Phone,0)
//         }
//       }
      
//     }, function () {
//       $scope.logStatus = '连接超时！'
//     })
//   }
//   $scope.goAgreement = function(){
//     $state.go('agreement')
//   }

//   $scope.wechatPhone = function(phoneNum,phoneCode){
//     var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/

//     $scope.logStatus = ''
//     if(phoneReg.test(phoneNum)){
//       if(phoneCode){
//         ionicLoadingshow()

//         User.verifySMS({mobile: phoneNum, smsType: 1, smsCode:phoneCode}).then(function (data) {
//           // alert('verifySMS'+JSON.stringify(data))
//           // alert('registerMode'+$scope.registerMode)
//           if(data.results == 0){
//             Storage.set('USERNAME',phoneNum)

//             if($scope.registerMode === 'wechatUnsigned'){
//               // 如果是未注册用户的微信登录，则还需填写密码和姓名（moreWechat动态显示需填写内容）
//               $scope.moreWechat = true
//               $ionicLoading.hide()
//             }else if($scope.registerMode === 'wechatSigned'){
//               // 如果是已注册但未绑定微信用户的微信登录，则直接绑定微信并登录
//               $q.all([
//                 User.setUnionId({phoneNo:phoneNum,openId:Storage.get('patientunionid')}),
//                 User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
//               ]).then(function(res){
//                 // alert('setUnionId'+JSON.stringify(res))
//                 User.logIn({username: Storage.get('patientunionid'), password: '112233', role: 'patient'}).then(function (succ) {
//                   // alert("userlogin"+JSON.stringify(succ))
//                   if (succ.results.mesg == 'login success!') {
//                     Storage.set('UID', succ.results.userId)// 后续页面必要uid
//                     Storage.set('TOKEN', succ.results.token)// token作用目前还不明确
//                     Storage.set('refreshToken', succ.results.refreshToken)
//                     $state.go('tab.tasklist')
//                     mySocket.newUser(succ.results.userId)
                    
//                   }
//                 },function(err){
//                   $ionicLoading.hide()
//                 })
//               },function(err){
//                 $ionicLoading.hide()
//               })
//             }else if( $scope.registerMode === 'wechatImported'){
//               // 如果是导入用户（已注册，未绑定微信但没签协议），则绑定微信后去签协议
//               $q.all([
//                 User.setUnionId({phoneNo:phoneNum,openId:Storage.get('patientunionid')}),
//                 User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
//               ]).then(function(res){
//                 // alert('setUnionId'+JSON.stringify(res))
//                 $state.go('agreement',{delay:true})
//               },function(err){
//                 $ionicLoading.hide()
//               })
//             }
//           }else{

//             $scope.logStatus = data.mesg
//             $ionicLoading.hide()
//           }
//         },function(err){
//           $scope.logStatus = JSON.stringify(err)
//           $ionicLoading.hide()
//         })

//       }else{
//         $scope.logStatus = '验证码不能为空！'
//       }
//     }else{
//       $scope.logStatus = '手机号验证失败！'
//     }
//   }
//   $scope.phoneRegister = function(register){ 
//     // 结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
//     var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
//     $scope.logStatus = ''
//     if($stateParams.rType === 'phone'){
//       if(phoneReg.test(register.Phone)){
//         if(register.Code){
//           if(register.newPass === register.confirm){
//             /**
//              * [验证手机号码]
//              * @Author   PXY
//              * @DateTime 2017-07-04
//              * @param    {mobile:String,smsType:Number,smsCode:String} 注：smsType写死1
//              * @return   data:{results:Number,mesg:String}  注：results为0代表验证成功
//              *           err
//              */
//             ionicLoadingshow()
            
//             User.verifySMS({mobile: register.Phone, smsType: 1, smsCode:register.Code}).then(function (data) {
//               if (data.results == 0) {
//                 User.register({phoneNo:register.Phone,password:register.confirm,name:register.name,role:'patient'}).then(function(res){
//                   Storage.set('UID',res.userNo)
//                   Storage.set('USERNAME',register.Phone)
//                   $q.all([
//                     User.updateAgree({userId:res.userNo,agreement:'0',role:'patient'}),
//                     User.setUnionId({phoneNo:register.Phone,openId:Storage.get('openid')}),
//                     //type为4是指患者app端，若为微信则要改为2
//                     User.setOpenId({type:2,openId:Storage.get('messageopenid'),userId:Storage.get('UID')})
//                   ]).then(function(succ){
//                     // alert('$Q返回' + JSON.stringify(succ))
//                     $ionicLoading.hide()
//                     $ionicLoading.show({
//                       template:"恭喜您，注册成功！即将返回登录页面，请稍后。",
//                       hideOnStateChange:true,
//                       duration:2000
//                     })
//                     $timeout(function(){$state.go('signin')},1000)
//                     if(Storage.get('agreement')){
//                       Storage.rm('agreement')
//                     }
//                   },function(err){
//                     $ionicLoading.hide()
//                   })
                  
//                 },function(err){
//                   $ionicLoading.hide()
//                 })
                
//               } else {
//                 $ionicLoading.hide()
//                 $scope.logStatus = data.mesg
//               }
//             }, function () {
//               $ionicLoading.hide()
//               $scope.logStatus = '连接超时！'
//             })
//           }else{
//             $scope.logStatus = '密码输入不一致！'
//           }
//         }else{
//           $scope.logStatus = '验证码不能为空！'
//         }
//       }else{
//         $scope.logStatus = '手机号验证失败！'
//       }
//     }

       
//   }

//   $scope.wxRegister = function(register){
//     // alert('register参数是'+JSON.stringify(register))
//       if(register.newPass === register.confirm){
//         ionicLoadingshow()
//         User.register({phoneNo:register.Phone,password:register.confirm,name:register.name,role:'patient'}).then(function(res){
//           Storage.set('UID',res.userNo)
//           Storage.set('USERNAME',register.Phone)
//           $q.all([
//             User.updateAgree({userId:res.userNo,agreement:'0',role:'patient'}),
//             User.setUnionId({phoneNo:register.Phone,openId:Storage.get('patientunionid')}),
//             //type为4是指患者app端，若为微信则要改为2
//             User.setOpenId({type:4,openId:Storage.get('openId'),userId:Storage.get('UID')})
//           ]).then(function(succ){
//             // alert('$Q返回' + JSON.stringify(succ))
//             $ionicLoading.hide()
//             $ionicLoading.show({
//               template:"恭喜您，注册成功！正在登录，请稍后。",
//               hideOnStateChange:true
//             })
//             User.logIn({username: Storage.get('patientunionid'), password: '112233', role: 'patient'}).then(function(data){
//               // alert("userlogin"+JSON.stringify(data))
//               if (succ.results.mesg == 'login success!') {
//                 Storage.set('UID', data.results.userId)// 后续页面必要uid
//                 Storage.set('TOKEN', data.results.token)// token作用目前还不明确
//                 Storage.set('refreshToken', data.results.refreshToken)
//                 mySocket.newUser(data.results.userId)
//                 $state.go('tab.tasklist')
//               }
//             },function(err){
//               $ionicLoading.hide()
//               $scope.logStatus = JSON.stringify(err)
//             })
            
//             if(Storage.get('agreement')){
//               Storage.rm('agreement')
//             }
//           },function(err){
//             $ionicLoading.hide()
//           })
          
//         },function(err){
//           $ionicLoading.hide()
//         })
            
        
//       }else{
//         $scope.logStatus = '密码输入不一致！'
//       }
//   }
  

// }])
// 忘记密码--手机号码验证--PXY
.controller('phonevalidCtrl', ['$scope', '$state', '$interval', '$stateParams', 'Storage', 'User',  function ($scope, $state, $interval, $stateParams, Storage, User) {
  // Storage.set("personalinfobackstate","register")

  $scope.Verify = {Phone: '', Code: ''}
  $scope.veritext = '获取验证码'
  $scope.isable = false

  /**
   * [disable获取验证码按钮1分钟，并改变获取验证码按钮显示的文字]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  var unablebutton = function () {
     // 验证码BUTTON效果
    $scope.isable = true
    $scope.veritext = '60s'
    var time = 59
    var timer
    timer = $interval(function () {
      if (time == 0) {
        $interval.cancel(timer)
        timer = undefined
        $scope.veritext = '获取验证码'
        $scope.isable = false
      } else {
        $scope.veritext = time + 's'
        time--
      }
    }, 1000)
  }

  /**
   * [发送验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    phone:String
   */
  var sendSMS = function (phone,count) {
    /**
     * [发送验证码,disable按钮一分钟，并根据服务器返回提示用户]
     * @Author   PXY
     * @DateTime 2017-07-04
     * @param    {mobile:String,smsType:Number}  注：写死 1
     * @return   data:{results:Number,mesg:String} 注：results为0为成功发送
     *           err
     */
    
    User.sendSMS({mobile: phone, smsType: 1}).then(function (data) {
      unablebutton()
      if (data.results == 1) {
        $scope.logStatus = '验证码发送失败！'
      } else if (data.mesg.substr(0, 8) == '您的邀请码已发送'){
        $scope.logStatus = '您的验证码已发送，重新获取请稍后'
      } else {
        $scope.logStatus = '验证码发送成功！'
      }
    }, function (err) {
      count++
      console.log(count)
      if (count < 5) {
        setTimeout(sendSMS(phone, count), 1000)
      } else {
        $scope.logStatus = '验证码发送失败！'
      }
    })
  }



  /**
   * [点击获取验证码，如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    Verify:{Phone:String,Code:String} 注：Code没用到
   */
  $scope.getcode = function (Verify) { 
    // console.log('123')
    $scope.logStatus = ''
   
    if (Verify.Phone == '') {
      $scope.logStatus = '手机号码不能为空！'
      return
    }
    var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
        // 手机正则表达式验证
    if (!phoneReg.test(Verify.Phone)) {
      $scope.logStatus = '手机号验证失败！'
      return
    }


    
    User.getUserID({username: Verify.Phone}).then(function (data) {
      if (data.results == 0 && data.roles.toString().indexOf('patient')>-1) {
        sendSMS(Verify.Phone,0)
      }else{
        $scope.logStatus = '该账户不存在！'
      }
    }, function () {
      $scope.logStatus = '连接超时！'
    })
  }


  /**
   * [点击验证手机号，通过后跳转设置密码页面]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    {[type]}
   * @return   {[type]}
   */
  $scope.gotoReset = function (Verify) {
    $scope.logStatus = ''
    if (Verify.Phone != '' && Verify.Code != '') {
        // 结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
      var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
            // 手机正则表达式验证
      if (phoneReg.test(Verify.Phone)) {
        // 测试用
        // if(Verify.Code==5566){
        //     $scope.logStatus = "验证成功";
        //     Storage.set('USERNAME',Verify.Phone);
        //     if($stateParams.phonevalidType == 'register'){
        //         $timeout(function(){$state.go('agreement',{last:'register'});},500);
        //     }else{
        //        $timeout(function(){$state.go('setpassword',{phonevalidType:$stateParams.phonevalidType});},500);
        //     }

        // }else{$scope.logStatus = "验证码错误";}
        /**
         * [验证手机号码]
         * @Author   PXY
         * @DateTime 2017-07-04
         * @param    {mobile:String,smsType:Number,smsCode:String} 注：smsType写死1
         * @return   data:{results:Number,mesg:String}  注：results为0代表验证成功
         *           err
         */
        User.verifySMS({mobile: Verify.Phone, smsType: 1, smsCode:Verify.Code}).then(function (data) {
          if (data.results == 0) {
            $scope.logStatus = '验证成功'
            Storage.set('USERNAME', Verify.Phone)
            
            $state.go('setpassword')
          } else {
            $scope.logStatus = data.mesg
          }
        }, function () {
          $scope.logStatus = '连接超时！'
        })
      } else { $scope.logStatus = '手机号验证失败！' }
     } else { $scope.logStatus = '请输入完整信息！' }
  }
}])

// 绑定微信--手机号码验证--TDY
.controller('bindwechatCtrl', ['$scope', '$state', '$interval', '$stateParams', 'Storage', 'User',  '$timeout', function ($scope, $state, $interval, $stateParams, Storage, User, $timeout) {
  // Storage.set("personalinfobackstate","register")

  $scope.Verify = {Phone: '', Code: ''}
  $scope.veritext = '获取验证码'
  $scope.isable = false
  $scope.Register = {}
  var tempuserId = ""

  /**
   * [disable获取验证码按钮1分钟，并改变获取验证码按钮显示的文字]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  var unablebutton = function () {
     // 验证码BUTTON效果
    $scope.isable = true
    $scope.veritext = '60s'
    var time = 59
    var timer
    timer = $interval(function () {
      if (time == 0) {
        $interval.cancel(timer)
        timer = undefined
        $scope.veritext = '获取验证码'
        $scope.isable = false
      } else {
        $scope.veritext = time + 's'
        time--
      }
    }, 1000)
  }

   /**
   * [发送验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    phone:String
   */
  var sendSMS = function (phone,count) {
    /**
     * [发送验证码,disable按钮一分钟，并根据服务器返回提示用户]
     * @Author   PXY
     * @DateTime 2017-07-04
     * @param    {mobile:String,smsType:Number}  注：写死 1
     * @return   data:{results:Number,mesg:String} 注：results为0为成功发送
     *           err
     */
    
    User.sendSMS({mobile: phone, smsType: 1}).then(function (data) {
      unablebutton()
      if (data.results == 0) {
        if (data.mesg.substr(0, 8) == '您的邀请码已发送') {
          $scope.logStatus = '您的验证码已发送，重新获取请稍后'
        } else {
          $scope.logStatus = '验证码发送成功！'
        }
      } else {
        $scope.logStatus = '验证码发送失败，请稍后再试'
      }
    }, function (err) {
      count++
      console.log(count)
      if (count < 5) {
        setTimeout(sendSMS(phone, count), 1000)
      } else {
        $scope.logStatus = '验证码发送失败！'
      }
     
    })
  }

  var ionicLoadingshow = function(){
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>', 
      hideOnStateChange:true  
    })
  }
  $scope.registerMode = null

  /**
   * [点击获取验证码，如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    Verify:{Phone:String,Code:String} 注：Code没用到
   */

  $scope.getcode = function () { 
    console.log($scope.Verify.Phone)
    $scope.logStatus = ''
   
    if ($scope.Verify.Phone == '') {

      $scope.logStatus = '手机号码不能为空！'
      return
    }
    var phoneReg = /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
        // 手机正则表达式验证
    if (!phoneReg.test($scope.Verify.Phone)) {
      $scope.logStatus = '手机号验证失败！'
      return
    }

     User.getUserID({username: $scope.Verify.Phone}).then(function(data){
          if(data.results == 0){
              tempuserId = data.UserId
              if(data.roles.indexOf('patient') == -1){  
                  $scope.logStatus = "该手机号码没有患者权限,请确认手机号码或返回登录页面进行注册！";
                  return;
              }else {
                  $scope.logStatus = "该手机号码已经注册,请验证手机号绑定微信";
                  sendSMS($scope.Verify.Phone,0);
              }
          }else if(data.results == 1){
              $scope.logStatus = "该用户不存在！请返回登录页面进行注册！"
              return;
          }
      },function(){
          $scope.logStatus="连接超时！";
      });
  }

  $scope.gotoReset = function(Verify){

        $scope.logStatus = '';
        if(Verify.Phone!="" && Verify.Code!=""){
        //结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
            var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
            //手机正则表达式验证
            if(phoneReg.test(Verify.Phone)){ 
                //测试用
                // if(Verify.Code==5566){
                //     $scope.logStatus = "验证成功";
                //     Storage.set('USERNAME',Verify.Phone);
                    // if($stateParams.phonevalidType == 'register'){
                    //     $timeout(function(){$state.go('agreement',{last:'register'});},500);
                    // }else{
                    //    $timeout(function(){$state.go('setpassword',{phonevalidType:$stateParams.phonevalidType});},500); 
                    // }
                    
                // }else{$scope.logStatus = "验证码错误";}
                var verifyPromise =  User.verifySMS({mobile:Verify.Phone,smsType:1,smsCode:Verify.Code});
                verifyPromise.then(function(data){
                    if(data.results==0){
                        $scope.logStatus = "验证成功";
                        Storage.set('USERNAME',Verify.Phone)
                        if (!(Storage.get('openid'))) {
                          $ionicPopup.show({
                            title: '退出账号时系统记录被清除，请返回公众号重新进入肾事管家',
                            buttons: [
                              {
                                text: '確定',
                                type: 'button-positive'
                              }
                            ]
                          })
                        }
                        else{
                          User.setUnionId({phoneNo:Verify.Phone,openId:Storage.get('openid')}).then(function(data){
                              if(data.results == "success!")
                              {
                                User.setOpenId({type:2,userId:tempuserId,openId:Storage.get('messageopenid')}).then(function(res){
                                    console.log("setopenid");
                                    $scope.logStatus = "微信绑定手机账号成功，即将返回登录页面"
                                    $timeout($state.go('signin'),2000)
                                },function(err){
                                    console.log("连接超时！");
                                })
                              }
                          },function(){
                              $scope.logStatus = "连接超时！";
                          })
                        }
                            
                    }else{
                        $scope.logStatus = data.mesg;
                        return;
                    }
                },function(){
                    $scope.logStatus = "连接超时！";
                })
            }
            else{$scope.logStatus="手机号验证失败！";}
      
     
    
        
        }
        else{$scope.logStatus = "请输入完整信息！";}
  }
}])
// 设置密码  --PXY
.controller('setPasswordCtrl', ['$ionicLoading', '$http', '$scope', '$state', '$rootScope', '$timeout', 'Storage',  'User', 'Patient', function ($ionicLoading, $http, $scope, $state, $rootScope, $timeout, Storage,  User, Patient) {

  /**
   * [点击返回，返回到登录页面]
   * @Author   PXY
   * @DateTime 2017-07-04
   */
  $scope.BackMain = function () {
    $state.go('signin')
  }

  $scope.setPassword = {newPass: '', confirm: ''}


  /**
   * [重置密码，密码一致后修改密码]
   * @Author   PXY
   * @DateTime 2017-07-04
   * @param    setPassword:{newPass:String,confirm:String}
   */
  $scope.resetPassword = function (setPassword) {
    $scope.logStatus = ''
    if (setPassword.newPass == setPassword.confirm) {
      // var phone = $stateParams.phoneNumber;
      
      /**
       * [修改密码]
       * @Author   PXY
       * @DateTime 2017-07-04
       * @param    {phoneNo:String，password:String}
       * @return   data:Object
       *           err
       */
      User.changePassword({phoneNo: Storage.get('USERNAME'), password: setPassword.newPass}).then(function (data) {
        if (data.results == 0) {
          $scope.logStatus = '重置密码成功！'
          $timeout(function () { $state.go('signin') }, 500)
        } else {
          $scope.logStatus = '该账户不存在！'
        }
      }, function () {
        $scope.logStatus = '连接超时！'
      })
    } else {
      $scope.logStatus = '两次输入的密码不一致'
    }
    
  }
}])

// 个人信息--PXY
.controller('userdetailCtrl', ['$http', '$stateParams', '$scope', '$state', '$ionicHistory', '$timeout', 'Storage', '$ionicPopup', '$ionicLoading', '$ionicPopover', 'Dict', 'Patient',  '$filter', 'Task', 'User', 'mySocket', function ($http, $stateParams, $scope, $state, $ionicHistory, $timeout, Storage, $ionicPopup, $ionicLoading, $ionicPopover, Dict, Patient,  $filter, Task, User, mySocket) {

   // 页面绑定数据初始化
  $scope.User =
  {
    userId: null,
    name: null,
    gender: null,
    bloodType: null,
    hypertension: null,
    class: null,
    class_info: null,
    height: null,
    weight: null,
    birthday: null,
    IDNo: null,
    allergic: null,
    operationTime: null,
    lastVisit: {
      time: null,
      hospital: null,
      diagnosis: null
    }

  }

/**
 * [进入页面之前完成个人信息的初始化,]
 * @Author   PXY
 * @DateTime 2017-07-05
 */
  $scope.$on('$ionicView.beforeEnter', function () {
    // showProgress为真显示疾病进程（自由文本）
    $scope.showProgress = false
    // showSurgicalTime为真显示手术时间（时间控件）
    $scope.showSurgicalTime = false
    // Diseases为疾病类型
    $scope.Diseases = ''
    // DiseaseDetails为疾病进程
    $scope.DiseaseDetails = ''
    // timename为手术时间（时间控件）的名称
    $scope.timename = ''
    initialPatient()
  })
/**
 * [点击返回，如果上一个页面是“我的”并且当前是编辑状态，则变为不可编辑状态，否则返回上一页]
 * @Author   PXY
 * @DateTime 2017-07-05
 */
  $scope.Goback = function () {
    if ($stateParams.last == 'mine' && $scope.canEdit == true) {
      $scope.canEdit = false
    } else {
      $ionicHistory.goBack()
    }
  }

  $scope.Genders =
  [
      {Name: '男', Type: 1},
      {Name: '女', Type: 2}
  ]

  $scope.BloodTypes =
  [
      {Name: 'A型', Type: 1},
      {Name: 'B型', Type: 2},
      {Name: 'AB型', Type: 3},
      {Name: 'O型', Type: 4},
      {Name: '不确定', Type: 5}
  ]

  $scope.Hypers =
  [
      {Name: '是', Type: 1},
      {Name: '否', Type: 2}
  ]

  /**
   * [从字典中搜索选中的对象]
   * @Author   PXY
   * @DateTime 2017-07-05
   * @param    code:String/Number  [字典中的编码，比如 1 或“stage_5”]
   * @param    array:Array [字典，数组存了对象，对象中包含名称和对应的值]
   * @return   object/ '未填写'        [根据字典编码在字典中搜索到的对象]
   */
  var searchObj = function (code, array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].Type == code || array[i].type == code || array[i].code == code) {
        return array[i]
      }
    }
    return '未填写'
  }
  /**
   * [根据选择的疾病类型判断显示疾病进程还是手术时间控件（以及时间控件的名称）]
   * @Author   PXY
   * @DateTime 2017-07-05
   * @param    Disease:Object {typeName:String,type:String} [疾病类型]
   */
  $scope.getDiseaseDetail = function (Disease) {
    if (Disease.typeName == '肾移植') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '手术日期'
    } else if (Disease.typeName == '血透') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '插管日期'
    } else if (Disease.typeName == '腹透') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '开始日期'
    } else if (Disease.typeName == 'ckd5期未透析') {
      $scope.showProgress = false
      $scope.showSurgicalTime = false
    } else {
      $scope.showProgress = true
      $scope.showSurgicalTime = false
      $scope.DiseaseDetails = Disease.details
    }
  }

  /**
   * [点击编辑按钮，页面变为可编辑状态]
   * @Author   PXY
   * @DateTime 2017-07-05
   */
  $scope.edit = function () {
    $scope.canEdit = true
  }
  /**
   * [从数据库读取个人信息并完成初始化]
   * @Author   PXY
   * @DateTime 2017-07-05
   */
  var initialPatient = function () {
    /**
     * [从数据库读取个人信息绑定数据,如果没填个人信息且上一页面是“我的”，页面不可编辑]
     * @Author   PXY
     * @DateTime 2017-07-05
     * @param    {userId:String}
     */
    Patient.getPatientDetail({userId: Storage.get('UID')}).then(function (data) {
        $scope.User = data.results
        // 避免最近就诊信息没填，上一步赋值造成lastVist未定义
        if (!data.results.lastVisit) {
          $scope.User.lastVisit = {time: null, hospital: null, diagnosis: null}
        }
        if ($scope.User.gender != null) {
          $scope.User.gender = searchObj($scope.User.gender, $scope.Genders)
        }
        if ($scope.User.bloodType != null) {
          $scope.User.bloodType = searchObj($scope.User.bloodType, $scope.BloodTypes)
        }
        if ($scope.User.hypertension != null) {
          $scope.User.hypertension = searchObj($scope.User.hypertension, $scope.Hypers)
        }


      /**
       * [从字典表获取疾病类型]
       * @Author   PXY
       * @DateTime 2017-07-05
       * @param    {category：String}  注：疾病类型对应category为'patient_class'
       * @return   data:{
                    "results": [
                                  {
                                      "_id": "58dcfa48e06bc54b27bf599c",
                                      "category": "patient_class",
                                      "content": [
                                          {
                                              "details": [
                                                  {
                                                      "invalidFlag": 0,
                                                      "description": "5",
                                                      "inputCode": "",
                                                      "name": "疾病活跃期",
                                                      "code": "stage_5"
                                                  },
                                                  {
                                                      "invalidFlag": 0,
                                                      "description": "6",
                                                      "inputCode": "",
                                                      "name": "稳定期",
                                                      "code": "stage_6"
                                                  }
                                              ],
                                              "typeName": "ckd3-4期",
                                              "type": "class_3"
                                          },...
                                      ],
                                      "contents": []
                                  }
                            ]
                      }
       */
      Dict.getDiseaseType({category: 'patient_class'}).then(function (data) {
        // push和shift是为了肾移植排在前面
        $scope.Diseases = data.results[0].content
        $scope.Diseases.push($scope.Diseases[0])
        $scope.Diseases.shift()
        if ($scope.User.class != null) {
                          
                          console.log($scope.Diseases);
          $scope.User.class = searchObj($scope.User.class, $scope.Diseases)
          console.log($scope.User.class);
          if ($scope.User.class.typeName == '血透') {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = '插管日期'
          } else if ($scope.User.class.typeName == '肾移植') {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = '手术日期'
          } else if ($scope.User.class.typeName == '腹透') {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = '开始日期'
          } else if ($scope.User.class.typeName == 'ckd5期未透析') {
            $scope.showProgress = false
            $scope.showSurgicalTime = false
          } else {
            $scope.showProgress = true
            $scope.showSurgicalTime = false
            $scope.DiseaseDetails = $scope.User.class.details
            console.log($scope.User.class)
            $scope.User.class_info = searchObj($scope.User.class_info[0], $scope.DiseaseDetails)
          }
        }
                          // console.log($scope.Diseases)
      }, function (err) {
        console.log(err)
      })
            // console.log($scope.User)
    }, function (err) {
      console.log(err)
    })
  }

  // 可以考虑封装一下，日期设置太多了
  // --------datepicker设置----------------
  var monthList = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  var weekDaysList = ['日', '一', '二', '三', '四', '五', '六']

  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject1.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
          // 日期的存储格式和显示格式不一致
      $scope.User.lastVisit.time = yyyy + '-' + m + '-' + d
    }
  }

  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    inputDate: new Date(),    // Optional
    mondayFirst: false,    // Optional
        // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      DiagnosisdatePickerCallback(val)
    }
  }
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject2.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.User.operationTime = yyyy + '-' + m + '-' + d
    }
  }
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    mondayFirst: false,    // Optional
        // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      OperationdatePickerCallback(val)
    }
  }
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject3.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
          // 日期的存储格式和显示格式不一致
      $scope.User.birthday = yyyy + '-' + m + '-' + d
    }
  }
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    mondayFirst: false,    // Optional
      // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      BirthdatePickerCallback(val)
    }
  }
  // --------datepicker设置结束----------------


  /**
   * [计算当前时间和usertime差几个月]
   * @Author   PXY
   * @DateTime 2017-07-05
   * @param    usertime:String [可解析的日期字符串]
   * @return   Number [相差月份数，floor取整]
   */
  var MonthInterval = function (usertime) {
    interval = new Date().getTime() - Date.parse(usertime)
    return (Math.floor(interval / (24 * 3600 * 1000 * 30)))
  }

  /**
   * [根据疾病类型、疾病进程或手术时间判断病人相应的任务模板，可考虑让后端在保存个人信息时完成]
   * @Author   PXY
   * @DateTime 2017-07-05
   * @param    kidneyType：String   [疾病类型，字典表编码]
   * @param    kidneyTime:String   [手术时间，可解析的日期字符串]
   * @param    kidneyDetail：String [疾病进程，字典表编码]
   * @return   SortNo:Number                [任务模板的编号]
   */
  var distinctTask = function (kidneyType, kidneyTime, kidneyDetail) {
    // debugger
    var sortNo = 1
    if (kidneyDetail) {
      var kidneyDetail = kidneyDetail[0]
    }
    switch (kidneyType) {
      case 'class_1':
                // 肾移植
        if (kidneyTime != undefined && kidneyTime != null && kidneyTime != '') {
          var month = MonthInterval(kidneyTime)
          console.log('month' + month)
          if (month >= 0 && month < 3) {
            sortNo = 1// 0-3月
          } else if (month >= 3 && month < 6) {
            sortNo = 2 // 3-6个月
          } else if (month >= 6 && month < 36) {
            sortNo = 3 // 6个月到3年
          } else if (month >= 36) {
            sortNo = 4// 对应肾移植大于3年
          }
        } else {
          sortNo = 4
        }
        break
      case 'class_2': case 'class_3':// 慢性1-4期
        if (kidneyDetail != undefined && kidneyDetail != null && kidneyDetail != '') {
          if (kidneyDetail == 'stage_5') { // "疾病活跃期"
            sortNo = 5
          } else if (kidneyDetail == 'stage_6') { // "稳定期
            sortNo = 6
          } else if (kidneyDetail == 'stage_7') { // >3年
            sortNo = 7
          }
        } else {
          sortNo = 6
        }
        break

      case 'class_4':// 慢性5期
        sortNo = 8
        break
      case 'class_5':// 血透
        sortNo = 9
        break

      case 'class_6':// 腹透
        sortNo = 10
        if (kidneyTime != undefined && kidneyTime != null && kidneyTime != '') {
          var month = MonthInterval(kidneyTime)
          // console.log('month' + month)
          if (month >= 6) {
            sortNo = 11
          }
        }
        break
    }
    return sortNo
  }

  /**
   * [修改病人的个人信息]
   * @Author   PXY
   * @DateTime 2017-07-05
   */
  var editPatientInfo = function () {
    // 非引用赋值，避免保存时更改了选择输入select的值时对应项显示空白
    var userInfo = $.extend(true, {}, $scope.User)
    userInfo.gender = userInfo.gender.Type
    userInfo.bloodType = userInfo.bloodType.Type
    userInfo.hypertension = userInfo.hypertension.Type
    if (userInfo.class.typeName == 'ckd5期未透析') {
      userInfo.class_info == null
    } else if (userInfo.class_info != null) {
      userInfo.class_info = userInfo.class_info.code
    }
    userInfo.class = userInfo.class.type
        // console.log($scope.User);
        // console.log(userInfo);
    var patientId = Storage.get('UID')
    userInfo.userId = patientId

    /**
     * [调用后端方法修改病人的个人信息]
     * @Author   PXY
     * @DateTime 2017-07-05
     * @param    userInfo:Object [属性和$scope.User一致，只是把需要选择输入的那几个字段比如性别的值从对象改为了对象中的编码]
     * @return   data:Object  {result:String,...}
     *           err
     */
    Patient.editPatientDetail(userInfo).then(function (data) {
      if (data.result == '修改成功') {
        console.log(data.results)
        var task = distinctTask(data.results.class, userInfo.operationTime, userInfo.class_info)
        /**
         * [修改病人的任务模板]
         * @Author   PXY
         * @DateTime 2017-07-05
         * @param    {userId:String, sortNo:Number}
         * @return   data:Object  {result:String,...}
         *           err
         */
        Task.insertTask({userId: patientId, sortNo: task}).then(function (data) {
          if (data.result == '插入成功') {
            if ($stateParams.last == 'mine') {
              $scope.canEdit = false
                            // initialPatient();
            } else if ($stateParams.last == 'tasklist' || $stateParams.last == 'consult') {
                            // console.log('goBack1');
              $ionicHistory.goBack()
            }
                        // }
          }
        }, function (err) {
          console.log('err' + err)
        })
      }
    }, function (err) {
      console.log(err)
    })
  }

  /**
   * [点击保存个人信息，弹窗提示用户并在其点击确定后修改个人信息]
   * @Author   PXY
   * @DateTime 2017-07-05
   */
  $scope.infoSetup = function () {
    $ionicPopup.show({
      template: '肾病类型及高血压等诊断信息的修改会影响肾病管理方案，建议在医生指导下修改，请谨慎！',
      title: '保存确认',
                      // subTitle: '2',
      scope: $scope,
      buttons: [
        {
          text: '取消',
          type: 'button-small',
          onTap: function (e) {}
        },
        {
          text: '确定',
          type: 'button-small button-positive ',
          onTap: function (e) { editPatientInfo() }
        }
      ]
    })
  }
}])

// 主页面--PXY
.controller('TabsCtrl', ['$ionicHistory', '$interval', 'News', 'Storage', '$scope', '$timeout', '$state', function ($ionicHistory, $interval, News, Storage, $scope, $timeout, $state) {
  // $scope.HasUnreadMessages = false;
  $scope.GoToMessage = function () {
    Storage.set('messageBackState', $ionicHistory.currentView().stateId)
    $state.go('messages')
  }
  $scope.gotomine = function () {
    $state.go('tab.mine')
  }

  $scope.gotomyDoctors = function () {
    $state.go('tab.myDoctors')
  }
    // var RefreshUnread;

  $scope.cancelGetMessage = function () {
        // console.log(RefreshUnread);
    // console.log('cancel')
    if (RefreshUnread) {
      $interval.cancel(RefreshUnread)
    };
  }
}])

// 任务列表--GL
.controller('tasklistCtrl', ['$interval', 'News', 'otherTask', '$scope', '$timeout', '$state', 'Storage', '$ionicHistory', '$ionicPopup', '$ionicModal', 'Compliance', '$window', 'Task', 'Patient', 'VitalSign', '$ionicLoading', function ($interval, News, otherTask, $scope, $timeout, $state, Storage, $ionicHistory, $ionicPopup, $ionicModal, Compliance, $window, Task, Patient, VitalSign, $ionicLoading) {
  $scope.goinsurance = function () {
    $state.go('insurance')
  }
  $scope.GoReport = function () {
    if($scope.unCompleted==false){
      $state.go('tab.Reports')
    }
    else{
         $ionicLoading.show({template: '请您先在个人信息中完善用户信息', duration: 1000})
      }
    }
  // 初始化
  var UserId = Storage.get('UID')
    // UserId = "Test13"; //
  $scope.Tasks = {} // 任务
  $scope.HemoBtnFlag = false // 血透排班设置标志
  var OverTimeTaks = []
  var index = 0
  var dateNowStr = ChangeTimeForm(new Date()) // 方便设定当前日期进行调试，或是之后从数据库获取当前日期

  var GetUnread = function () {
        // console.log(new Date());
    console.log("message refresh")
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: 0, userRole: 'patient'}).then(//
      function (data) {
        console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
            if (data.results[0].type==11) {
                str1=data.results[0].title.split(",")[1]
                str2=str1.split(":")[1]
                str3=str2.split("}")[0]
                $scope.newMes= "最新消息：医生"+str3+"给您发来一条聊天消息“"+data.results[0].description+"”"
                
            } else {
                if(data.results[0].type==8){
                   $scope.newMes= "最新消息：您的医生"+ data.results[0].description.split('主管医生')[1]
                }else{
                   $scope.newMes= "最新消息："+ data.results[0].description
                }
            } 
            if($scope.newMes.length>=80){
              $scope.newMes = $scope.newMes.slice(0,79)+ "..."
            } 

              // console.log($scope.newMes.length)    
        } else {
          $scope.HasUnreadMessages = false
          $scope.newMes= "最新消息：没有最新的未读消息！"
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
           $interval.cancel(RefreshUnread)
        }
        console.log(err)
    })
  }
  GetUnread()

  $scope.$on('$ionicView.enter', function () {
    GetTasks()
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 60000)
  })

  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    if (toState.name !== 'tab.myDoctors' && toState.name !== 'tab.forum' && toState.name !== 'tab.mine' && toState.name !== 'tab.tasklist') {
      if (RefreshUnread) {
        $interval.cancel(RefreshUnread)
      };
    }
  })
  // 判断是否需要修改任务时间
  function IfTaskOverTime (startTime, frequencyTimes, unit, times) {
    var res = ''
    var days = GetDifDays(startTime, dateNowStr)
    if ((unit == '年') && (times == 2))// 一年2次
        {
      unit = '月'
      frequencyTimes = 6
    }
    var tbl = {'周': 7, '月': 30, '年': 365}
    var someDays = tbl[unit] * frequencyTimes
    if (days < 0) {
      while (days < -someDays) // 若长时间未使用APP使日期错过了下次任务，则再往后延
            {
        startTime = ChangeTimeForm(SetNextTime(startTime, frequencyTimes, unit, times))
        days = GetDifDays(startTime, dateNowStr)
      }
      res = startTime
    }
        // console.log(res);
    return res
  }
   // IfTaskOverTime("2017-04-05", 1, "周",1 );

  // 当前日期与默认日期比较，自动修改填写状态
  function CompDateToDefault (task) {
    var res = false
    var freqTimes = task.frequencyTimes
    var unit = task.frequencyUnits
    var times = task.frequencyTimes
    var dateNow = new Date(dateNowStr)
    var dateStart = new Date(task.startTime)
    if (times == 1) // 只对周期内1次任务有效
      {
      if (unit == '周') {
        var weekDayNow = dateNow.getDay()
        var days = GetDifDays(task.startTime, dateNowStr)
        if ((weekDayNow >= 1) && (days < 7))// 已过周一
              {
          res = true
        }
      } else if (unit == '月') {
        var monthNow = dateNow.getMonth()
        var monthStart = dateStart.getMonth()
        if (monthNow == monthStart) {
          res = true
        }
      } else // 年
          {
        var yearNow = dateNow.getFullYear()
        var yearStart = dateStart.getFullYear()
        if (yearNow == yearStart) {
          res = true
        }
      }
    }
    task.Flag = !res
  }
   // CompDateToDefault({});

  // 获取对应任务模板
  function GetTasks (TaskCode) {
    var promise = Task.getUserTask({userId: UserId})
    promise.then(function (data) {
      // console.log(data)
      if (data.result) {
        $scope.unCompleted = false
        $scope.Tasks = data.result.task

        HandleTasks()
      } else {
        $scope.unCompleted = true
      }
    }, function () {

    })
  }

  // 获取模板后进行处理
  function HandleTasks () {
    $scope.Tasks.Other = []
    $scope.Tasks.Hemo = []
    for (var i = 0; i < $scope.Tasks.length; i++) {
      var task = $scope.Tasks[i]
           // console.log(task);
      if (task.type == 'Measure') {
        InitialEveTask(task)
      } else // 其他任务
           {
        InitialOtherTask(task)
      }
    }
    // console.log($scope.Tasks.Measure)
    // console.log($scope.Tasks.Other)
    $scope.Tasks.Other.sort(SortByTime) // 按时间先后排序
    for (var i = 0; i < $scope.Tasks.Other.length; i++) {
      if ($scope.Tasks.Other[i].frequencyTimes == 0)// 只执行一次的任务置顶
            {
        var item = $scope.Tasks.Other[i]
        $scope.Tasks.Other.splice(i, 1)
        $scope.Tasks.Other.unshift(item)
      }
    }
    GetDoneTask()
     // console.log($scope.Tasks);
  }

  // 初始化每日任务
  function InitialEveTask (task) {
    $scope.Tasks.Measure = task.details
    for (var i = 0; i < $scope.Tasks.Measure.length; i++) {
      $scope.Tasks.Measure[i].type = 'Measure'
      if ($scope.Tasks.Measure[i].frequencyUnits == '天')// 限定每日完成的任务
            {
        $scope.Tasks.Measure[i].Name = NameMatch($scope.Tasks.Measure[i].code)
        $scope.Tasks.Measure[i].Unit = UnitMatch($scope.Tasks.Measure[i].code)
        $scope.Tasks.Measure[i].Range = RangeMatch($scope.Tasks.Measure[i].code)
        $scope.Tasks.Measure[i].Freq = $scope.Tasks.Measure[i].frequencyTimes + $scope.Tasks.Measure[i].frequencyUnits + $scope.Tasks.Measure[i].times + $scope.Tasks.Measure[i].timesUnits
        $scope.Tasks.Measure[i].Flag = false
        if ($scope.Tasks.Measure[i].times > 1) {
          $scope.Tasks.Measure[i].TimesFlag = true
          $scope.Tasks.Measure[i].Progress = '0'
        } else {
          $scope.Tasks.Measure[i].TimesFlag = false
        }
      } else // 测量中的非每日任务 加入Other并从测量中去除（即血管通路情况）
            {
        var newTask = $scope.Tasks.Measure[i]
        HandlOtherTask(newTask, task)
        $scope.Tasks.Measure.splice(i, 1)
      }
    }
  }

  // 初始化血透任务
  function InitialHemoTask (task) {
    task.type = 'ReturnVisit'
    if (task.content == '') // 未设定排班时间
        {
      $scope.HemoBtnFlag = true
    } else {
      task.DateStr = task.content
      $scope.HemoBtnFlag = false
      var StartArry = task.DateStr.split('+')[0].split(',')
      var EndArry = []
      task.Flag = false
      task.Progress = '0'
      if (task.DateStr.split('+')[2]) {
        task.endTime = task.DateStr.split('+')[2]
        EndArry = task.DateStr.split('+')[2].split(',')
        task.Progress = (Math.round(EndArry.length / task.times * 10000) / 100).toFixed(2) + '%' // 进度条
        if (EndArry.length == task.times) {
          task.Flag = true
        }
      } else {
        task.endTime = ''
      }
            // 判定是否为新的一周以更新任务日期
      var days = GetDifDays(dateNowStr, StartArry[0])
      if (days >= 7) {
        task.Flag = false
        while (days >= 7) {
          for (var i = 0; i < StartArry.length; i++) {
            StartArry[i] = ChangeTimeForm(SetNextTime(StartArry[i], task.frequencyTimes, task.frequencyUnits, task.times))
          }
          days = GetDifDays(dateNowStr, StartArry[0])
        }
        task.DateStr = GetHemoStr(StartArry, task.DateStr.split('+')[1], [])
                // 修改数据库
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
        UpdateUserTask(item)  // 更改任务下次执行时间
      }
      task.Name = '血透'
      task.startTime = task.DateStr.split('+')[0]
      $scope.Tasks.Hemo.push(task)
            // console.log( $scope.Tasks.Hemo);
    }
  }

  // 初始化其他任务
  function InitialOtherTask (task) {
    for (var i = 0; i < task.details.length; i++) {
      var newTask = task.details[i]
      if ((task.type == 'ReturnVisit') && (newTask.code == 'stage_9'))// 血透排班
            {
        InitialHemoTask(newTask)
      } else {
        HandlOtherTask(newTask, task)
      }
    }
    if (OverTimeTaks.length != 0) {
      ChangeOverTime()// 过期任务新任务时间插入数据库
    }
  }

  // 处理其他任务详细
  function HandlOtherTask (newTask, task) {
    newTask.Flag = false
    newTask.DoneFlag = false
    newTask.type = task.type
    newTask.Name = NameMatch(newTask.type)
    if (newTask.type == 'Measure') // 血管通路情况
      {
      newTask.Name = NameMatch(newTask.code)
    }
    newTask.Freq = newTask.frequencyTimes + newTask.frequencyUnits + newTask.times + newTask.timesUnits
    if ((newTask.type == 'LabTest') && (newTask.code == 'LabTest_9')) {
      newTask.Freq = '初次评估'
    }
    if (newTask.endTime != '2050-11-02T07:58:51.718Z') // 显示已执行时间
      {
      newTask.Flag = true
      newTask.DoneFlag = true
      newTask.endTime = newTask.endTime.substr(0, 10)
    }

    var TimeCompare = IfTaskOverTime(newTask.startTime, newTask.frequencyTimes, newTask.frequencyUnits, newTask.times) // 错过任务执行时间段，后延
    if (TimeCompare != '') {
      newTask.startTime = TimeCompare
      newTask.Flag = false
      OverTimeTaks.push(newTask)
    } else {
      var days = GetDifDays(newTask.startTime, dateNowStr)
      if (days <= 0) {
        newTask.Flag = false
      } else {
        if (newTask.Flag) // 到默认时间修改填写状态
           {
          CompDateToDefault(newTask)
        }
      }
    }
    $scope.Tasks.Other.push(newTask)
  }

  // 批量更新任务
  function ChangeOverTime () {
    var temp = OverTimeTaks[index]
    var task = {
      'userId': UserId,
      'type': temp.type,
      'code': temp.code,
      'instruction': temp.instruction,
      'content': temp.content,
      'startTime': temp.startTime,
      'endTime': temp.endTime,
      'times': temp.times,
      'timesUnits': temp.timesUnits,
      'frequencyTimes': temp.frequencyTimes,
      'frequencyUnits': temp.frequencyUnits
    }
    var promise = Task.updateUserTask(task)
    promise.then(function (data) {
      if (data.results) {
        index = index + 1
        if (index < OverTimeTaks.length) {
          ChangeOverTime()
        }
      };
    }, function () {
    })
  }

  // 获取今日已执行任务
  function GetDoneTask () {
    var nowDay = dateNowStr
    var promise = Compliance.getcompliance({userId: UserId, date: nowDay})
    promise.then(function (data) {
      if (data.results) {
        for (var i = 0; i < data.results.length; i++) {
          AfterDoneTask(data.results[i], 'GET')
        }
      }
           // console.log(data.results);
      ChangeLongFir()// 修改长周期任务第一次执行时间
    }, function () {
    })
  }

  // 获取今日已执行任务后进行处理(falg用于区分获取还是新插入已执行任务)
  function AfterDoneTask (doneTask, flag) {
      // 确定任务是否完成，修改显示标志位，获取已填写的数值并在页面显示
    var Code = doneTask.code
    var Description = doneTask.description
    // console.log(doneTask)
    EveTaskDone(doneTask, flag)
    if (flag == 'POST') {
      if ((doneTask.type == 'ReturnVisit') && (doneTask.code == 'stage_9')) // 血透排班
          {
        $scope.Tasks.Hemo[0].instruction = Description
        HemoTaskDone($scope.Tasks.Hemo[0])
      } else {
        for (var i = 0; i < $scope.Tasks.Other.length; i++) {
          var task = $scope.Tasks.Other[i]
          if (task.code == Code) {
            console.log(task)
            OtherTaskDone(task, Description)
            break
          }
        }
      }
    }
  }

  // 每日任务执行后处理
  function EveTaskDone (doneTask, flag) {
        // 或许只是测量任务才会进行处理？
    var Code = doneTask.code
    var Description = doneTask.description
    var flag1 = false
    for (var i = 0; i < $scope.Tasks.Measure.length; i++) {
      if ($scope.Tasks.Measure[i].code == Code) {
        $scope.Tasks.Measure[i].instruction = Description
        flag1 = true
        var num = i
        if ($scope.Tasks.Measure[i].times == 1) // 每天一次
                {
          $scope.Tasks.Measure[i].Flag = true
        } else // 多次(修改进度条)
                {
          var ValueArry = Description.split('，')
                    // console.log(ValueArry);
          if (ValueArry.length == $scope.Tasks.Measure[i].times) {
            $scope.Tasks.Measure[i].Flag = true
            $scope.Tasks.Measure[i].DoneTimes = ValueArry.length
          }
          $scope.Tasks.Measure[i].Progress = (Math.round(ValueArry.length / $scope.Tasks.Measure[i].times * 10000) / 100).toFixed(2) + '%'
        }
        break
      }
    }
    if (flag1) // 插入体征表
        {
      if ((flag == 'POST') && (VitalSignTbl[$scope.Tasks.Measure[num].code])) {
        var task = $scope.Tasks.Measure[num]
        if (task.code == 'BloodPressure')// console.log(task);
               {
          var array = Description.split('，')
          var i = array.length
          var temp = {
            'patientId': UserId,
            'type': VitalSignTbl[task.code].type,
            'code': VitalSignTbl[task.code].code,
            'date': dateNowStr,
            'datatime': new Date(),
            'datavalue': array[i - 1].split('/')[0],
            'datavalue2': array[i - 1].split('/')[1],
            'unit': task.Unit
          }
        } else {
          var array = Description.split('，')
          var i = array.length
          var temp = {
            'patientId': UserId,
            'type': VitalSignTbl[task.code].type,
            'code': VitalSignTbl[task.code].code,
            'date': dateNowStr,
            'datatime': new Date(),
            'datavalue': array[i - 1],
            'unit': task.Unit
          }
        }
        InsertVitalSign(temp)
      }
    }
  }

  // 其他任务后处理
  function OtherTaskDone (task, Description) {
    var NextTime = ''
    var item
        // var instructionStr = task.instruction;//避免修改模板 暂时就让它修改吧
    task.instruction = Description // 用于页面显示
    console.log('attention')
    console.log(task.endTime)
    task.Flag = true
    task.endTime = task.endTime.substr(0, 10)
    if (task.endTime != '2050-11-02T07:58:51.718Z') // 说明任务已经执行过
        {
      task.DoneFlag = true
    } else {
      task.DoneFlag = false
    }
    NextTime = ChangeTimeForm(SetNextTime(task.startTime, task.frequencyTimes, task.frequencyUnits, task.times))
    task.startTime = NextTime// 更改页面显示
    task.endTime = dateNowStr
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
    console.log(item)
    UpdateUserTask(item)  // 更改任务下次执行时间
  }

  // 血透任务执行后处理
  function HemoTaskDone (task, flag) {
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

  // 血透字符串组装
  function GetHemoStr (startArry, mediean, endArry) {
    var res = ''
    res = startArry.join(',') + '+' + mediean
    if (endArry.length != 0) {
      res = res + '+' + endArry.join(',')
    }
    return res
  }

  // 名称转换
  function NameMatch (name) {
    var Tbl = [
                 {Name: '体温', Code: 'Temperature'},
                 {Name: '体重', Code: 'Weight'},
                 {Name: '血压', Code: 'BloodPressure'},
                 {Name: '尿量', Code: 'Vol'},
                 {Name: '心率', Code: 'HeartRate'},
                 {Name: '复诊', Code: 'ReturnVisit'},
                 {Name: '化验', Code: 'LabTest'},
                 {Name: '特殊评估', Code: 'SpecialEvaluate'},
                 {Name: '血管通路情况', Code: 'VascularAccess'},
                 {Name: '腹透', Code: 'PeritonealDialysis'},
                 {Name: '超滤量', Code: 'cll'},
                 {Name: '浮肿', Code: 'ywfz'},
                 {Name: '引流通畅', Code: 'yl'}
    ]
    for (var i = 0; i < Tbl.length; i++) {
      if (Tbl[i].Code == name) {
        name = Tbl[i].Name
        break
      }
    }
    return name
  }

  // 单位匹配
  function UnitMatch (code) {
    var Unit = ''
    var Tbl = [
                 {Code: 'Temperature', Unit: '摄氏度'},
                 {Code: 'Weight', Unit: 'kg'},
                 {Code: 'BloodPressure', Unit: 'mmHg'},
                 {Code: 'Vol', Unit: 'mL'},
                 {Code: 'HeartRate', Unit: '次/分'},
                 {Code: 'cll', Unit: 'mL'}
    ]
    for (var i = 0; i < Tbl.length; i++) {
      if (Tbl[i].Code == code) {
        Unit = Tbl[i].Unit
        break
      }
    }
    return Unit
  }

  // 范围匹配
  function RangeMatch (code) {
    var res = {}
    var Tbl = [
                 {Code: 'Temperature', Min: 35, Max: 42},
                 {Code: 'Weight', Min: 0, Max: 300},
                 {Code: 'BloodPressure', Min: 0, Max: 250},
                 {Code: 'Vol', Min: 0, Max: 5000},
                 {Code: 'HeartRate', Min: 30, Max: 200}
    ]
    for (var i = 0; i < Tbl.length; i++) {
      if (Tbl[i].Code == code) {
        res.Min = Tbl[i].Min
        res.Max = Tbl[i].Max
        break
      }
    }
    return res
  }

  // 时间比较排序
  function SortByTime (a, b) {
    var res = 0
    var strA = a.startTime.substr(0, 10).replace(/-/g, '')
    var strB = b.startTime.substr(0, 10).replace(/-/g, '')
    if ((!isNaN(strA)) && (!isNaN(strB))) {
      res = parseInt(strA) - parseInt(strB)
    }
    return res
  }

  // 比较时间天数
  function GetDifDays (date1Str, date2Str) {
    res = 0
    var date1 = new Date(date1Str)
    var date2 = new Date(date2Str)
    if ((date1 instanceof Date) && (date2 instanceof Date)) {
      days = date1.getTime() - date2.getTime()
      res = parseInt(days / (1000 * 60 * 60 * 24))
    }
    return res
  }

  // 比较下次任务时间与当前时间
  function CompareTime (startTime, frequencyTimes, unit, times) {
    var res = {'Flag': false, 'Date': ''}
    var date1 = new Date(dateNowStr)
    var date2 = new Date(startTime)
    var days = date2.getTime() - date1.getTime()

    while (days < 0) // 若长时间未使用APP使日期错过了下次任务，则再往后延
        {
      date2 = SetNextTime(date2.toString(), frequencyTimes, unit, times)
      days = date2.getTime() - date1.getTime()
      res.Date = ChangeTimeForm(date2)
    } var day = parseInt(days / (1000 * 60 * 60 * 24))
    if (day <= 7) {
      res.Flag = true
    }
    return res
  }
   // CompareTime("2017-06-24", 2, "周", 1);

  // 插入任务执行情况
  function Postcompliance (task) {
    console.log(task)
    var promise = Compliance.postcompliance(task)
    promise.then(function (data) {
      console.log(data)
      if (data.results) {
              // console.log(data.results);
        AfterDoneTask(data.results, 'POST')
      }
    }, function () {
    })
  }

  // 插入体征数据
  function InsertVitalSign (task) {
    var promise = VitalSign.insertVitalSign(task)
    promise.then(function (data) {
      if (data.results) {
        console.log(data.results)
      }
    }, function () {
    })
  }


  // 体征字典
  var VitalSignTbl = {'Temperature': {code: '体温', type: '体温'},
    'Weight': {code: '体重', type: '体重'},
    'BloodPressure': {code: '血压', type: '血压'},
    'Vol': {code: '尿量', type: '尿量'},
    'HeartRate': {code: '心率', type: '心率'}
  }

  // 更新用户任务模板
  function UpdateUserTask (task) {
    var promise = Task.updateUserTask(task)
    promise.then(function (data) {
         // console.log(data);
      if (data.results) {
          // console.log(data.results);
      };
    }, function () {
    })
  }

  // 修改长期任务第一次时间
  function ChangeLongFir () {
        // 界面
    for (var i = 0; i < $scope.Tasks.Other.length; i++) {
      if ($scope.Tasks.Other[i].startTime == '2050-11-02T07:58:51.718Z') // 未设定时间时
          {
        $scope.Tasks.Other[i].startTime = SetTaskTime($scope.Tasks.Other[i].frequencyUnits, $scope.Tasks.Other[i].times)
      }
          // 注释掉了else那段不知道会不会有影响
          // else
          // {
             // $scope.Tasks.Other[i].startTime = $scope.Tasks.Other[i].startTime.substr(0,10);
          // }
          /* var item = $scope.Tasks.Other[i];  //先不管吧
          var CompRes = CompareTime(item.startTime, item.frequencyTimes, item.frequencyUnits, item.times);
          if(!CompRes.Flag)
          {
              $scope.Tasks.Other[i].Flag = true;
          } */
    }
        // 数据库
    for (var i = 0; i < $scope.Tasks.Other.length; i++) {
      if ($scope.Tasks.Other[i].startTime != '2050-11-02T07:58:51.718Z') // 修改任务执行时间
          {
        var temp = $scope.Tasks.Other[i]
        var task = {
          'userId': UserId,
          'type': temp.type,
          'code': temp.code,
          'instruction': temp.instruction,
          'content': temp.content,
          'startTime': temp.startTime,
          'endTime': temp.endTime,
          'times': temp.times,
          'timesUnits': temp.timesUnits,
          'frequencyTimes': temp.frequencyTimes,
          'frequencyUnits': temp.frequencyUnits
        }
        UpdateUserTask(task)
      }
    }
  }

  // 设定长期任务第一次时间
  function SetTaskTime (Type, Times) {
      // 暂时就用本地时间
    var CurrentDate = new Date(dateNowStr)
    var NewDate
    var WeekDay = CurrentDate.getDay() // 0-6 0为星期日
    var Day = CurrentDate.getDate() // 1-31
    var Month = CurrentDate.getMonth() // 0-11,0为1月

    var Num = 0
    if (Type == '周') {
      Num = 1// 默认周一

      if (Num >= WeekDay) // 所选日期未过，选择本星期
         {
        NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay))
      } else // 下个星期
         {
        NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay))
      }
    } else if (Type == '月') {
      Num = 1 // 默认1日
      NewDate = new Date(CurrentDate.setDate(Num))
      if (Num < Day) // 所选日期已过，选择下月
         {
        NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1))
      }
    } else if (Type == '年') {
      if (Times == 2) // 一年2次 -- 6月1次
         {
        Num = 1
        NewDate = new Date(CurrentDate.setDate(Num))
        if (Num < Day) // 所选日期已过，选择下月
            {
          NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1))
        }
      } else {
        Num = 0 // 默认1月
        NewDate = new Date(CurrentDate.setMonth(Num))
        if (Num < Month)// 所选日期已过，选择明年
             {
          NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1))
        }
      }
    }
      // console.log(ChangeTimeForm(NewDate));
    return ChangeTimeForm(NewDate)
  }

  // 弹框格式
  var PopTemplate = {
    Input: '<input type="text" ng-model="data.value"><p ng-if = "data.alertFlag" style="color:red;">{{data.alertWords}}</P>',
    InputBP: '收缩压<input type="text" ng-model="data.value1"><p ng-if = "data.alertFlag1" style="color:red;">123{{data.alertWords1}}</P>' +
                                '舒张压<input type="text" ng-model="data.value2"><p ng-if = "data.alertFlag2" style="color:red;">{{data.alertWords2}}</P>',
    Textarea: '<textarea type="text" ng-model="data.value" rows="10" cols="100"></textarea>',
    Select: '<select ng-model = "data.value"><option >是</option><option >否</option></select>'
  }// Textarea：VascularAccess；

  // 测量弹窗
  $scope.showMesPop = function (task, type) {
        // 首先swipe-back

    $scope.data = {}
    $scope.data.alertFlag = false
      // console.log(task);
    var PopInfo = GetPopInfo('input', type, task)
    $scope.data.value = PopInfo.content
    var myPopup = $ionicPopup.show({
      template: PopInfo.Template,
      cssClass: 'popupWithKeyboard',
      title: PopInfo.word,
      scope: $scope,
      buttons: [
            { text: '取消' },
        {
          text: '保存',
          type: 'button-positive',
          onTap: function (e) {
            if (PopInfo.flag == 'InputBP') {
              if ((!$scope.data.value1) || (!$scope.data.value2)) {
                e.preventDefault()
              } else {
                var Range1 = AboutRange($scope.data.value1, task.code)
                var Range2 = AboutRange($scope.data.value2, task.code)
                var word1 = Range1.word
                var word2 = Range2.word
                if (word1 != '') {
                  $scope.data.alertWords1 = word1
                  $scope.data.alertFlag1 = true
                  e.preventDefault()
                } else if (word2 != '') {
                  $scope.data.alertWords2 = word2
                  $scope.data.alertFlag2 = true
                  e.preventDefault()
                } else {
                  if ((Range1.num > 140) || (Range2.num > 90)) {
                    $scope.showAlert()
                  }
                  return Range1.str + '/' + Range2.str
                }
              }
            } else {
              if (!$scope.data.value) {
                e.preventDefault()
              }
              if (PopInfo.flag == 'input') {
                var Range = AboutRange($scope.data.value, task.code)
                var word = Range.word
                if (word != '') {
                  $scope.data.alertWords = word
                  $scope.data.alertFlag = true
                  e.preventDefault()
                } else {
                  return Range.str
                }
              } else {
                console.log($scope.data.value)
                if (!$scope.data.value) {
                  e.preventDefault()
                } else {
                  return $scope.data.value
                }
              }
            }
          }
        }
      ]
    })
    myPopup.then(function (res) {
      if (res) {
        var Description = res
          // 向任务表中插入数据
        if ((task.frequencyUnits == '天') && (task.instruction != '')) {
          if (type == 'fill') {
            Description = task.instruction + '，' + Description // 若为一天多次的任务
          } else {
            var arry = task.instruction.split('，')
            arry[arry.length - 1] = res
            Description = arry.join('，')
          }
        }
        var item = {
          'userId': UserId,
          'type': task.type,
          'code': task.code,
          'date': dateNowStr,
          'status': 0,
          'description': Description
        }

          // console.log(item);
        Postcompliance(item)
      }
    })
  }

  // 弹窗标题、输入类型、显示内容
  function GetPopInfo (flag, type, task) {
    var res = {}
    var Template = PopTemplate.Input // 默认为输入框
    var word = '请填写' + task.Name + '(' + task.Unit + ')'
    var content = ''
    var instruction = task.instruction
    if ((task.code == 'ywfz') || (task.code == 'yl')) {
      flag = 'Select'
      Template = PopTemplate.Select
      if (task.code == 'ywfz') {
        word = '请选择是否浮肿'
      } else {
        word = '请选择引流是否通畅'
      }
      if (instruction != '') {
        content = instruction
      }
    } else if (task.code == 'BloodPressure') {
      flag = 'InputBP'
      Template = PopTemplate.InputBP
      if (instruction != '') {
        if (type == 'edit') {
          word = task.Name + '(' + task.Unit + ')'
          var arry = instruction.split('，')
          var blStr = arry[arry.length - 1]
          $scope.data.value1 = blStr.split('/')[0]
          $scope.data.value2 = blStr.split('/')[1]
        }

      }
      $scope.data.alertFlag1 = false
      $scope.data.alertFlag2 = false
    } else {
      if (instruction == '') {
        type = 'fill'
      }
      if (type == 'edit') {
        word = task.Name + '(' + task.Unit + ')'
        content = instruction
        var arry = content.split('，')
        content = arry[arry.length - 1]
      }
    }
    res.Template = Template
    res.word = word
    res.content = content
    res.flag = flag
    return res
  }

  $scope.CompleteUserdetail = function () {
    $state.go('userdetail', {last: 'tasklist'})
  }

  // 血透弹窗
  $scope.showHemoPop = function (task, type) {
    $scope.data = {}
    $scope.data.alertFlag = false
      // console.log(task);
    if (task.instruction == '') {
      type = 'fill'
    }
    if (type == 'edit') {
      var arry = task.instruction.split('，')
      $scope.data.value = arry[arry.length - 1]
      word = task.Name + '情况'
    } else {
      content = ''
      word = '请填写' + task.Name + '情况'
    }
    var myPopup = $ionicPopup.show({
      template: PopTemplate.Textarea,
      title: word,
      scope: $scope,
      buttons: [
           { text: '取消' },
        {
          text: '保存',
          type: 'button-positive',
          onTap: function (e) {
            if (!$scope.data.value) {
                 // 不允许用户关闭，除非输入内容
              e.preventDefault()
            } else {
              return $scope.data.value
            }
          }
        }
      ]
    })
    myPopup.then(function (res) {
      if (res) {
        var Description = res
        if (task.instruction == '设定血透排班') {
          task.instruction = ''
        }
        if ((type == 'fill') && (task.instruction != '')) {
          Description = task.instruction + '，' + Description
        } else {
          var arry = task.instruction.split('，')
          arry[arry.length - 1] = res
          Description = arry.join('，')
        }
        var item = {
          'userId': UserId,
          'type': task.type,
          'code': task.code,
          'date': dateNowStr,
          'status': 0,
          'description': Description
        }

          // console.log(item);
        Postcompliance(item)
      }
    })
  }

  // 其他任务弹窗
  $scope.showOtherPop = function (task, type) {
    if (!task.Flag) {
      type = 'fill'
    }
        // PXY 如果是复诊和化验就跳到健康详情页面,除了以往格式不对的数据的编辑
    if (task.Name == '化验' || task.Name == '复诊') {
      var date = new Date(task.instruction)
      var healthinfo = {id: null, caneidt: true}
      if (type == 'fill') {
        Storage.set('task', JSON.stringify({type: task.type, code: task.code}))
        Storage.set('otherTasks', JSON.stringify($scope.Tasks.Other))
        $state.go('tab.myHealthInfoDetail', healthinfo)
        return
      } else if (type == 'edit' && date != 'Invalid Date') {
        Storage.set('task', JSON.stringify({type: task.type, code: task.code}))
        Storage.set('otherTasks', JSON.stringify($scope.Tasks.Other))
        healthinfo.id = {insertTime: task.instruction}
        $state.go('tab.myHealthInfoDetail', healthinfo)
        return
      }
    }
    $scope.data = {}
    $scope.data.alertFlag = false
    $scope.data.value = task.instruction
    console.log($scope.data.value)
    word = task.Name + '情况'
    if (type == 'fill') {
      word = '请填写' + word
      $scope.data.value = ''
    }

    var myPopup = $ionicPopup.show({
      template: PopTemplate.Textarea,
      title: word,
      scope: $scope,
      buttons: [
             { text: '取消' },
        {
          text: '保存',
          type: 'button-positive',
          onTap: function (e) {
            if (!$scope.data.value) {
                   // 不允许用户关闭，除非输入内容
              e.preventDefault()
            } else {
              return $scope.data.value
            }
          }
        }
      ]
    })

    myPopup.then(function (res) {
      if (res) {
            // 向任务表中插入数据
        var item = {
          'userId': UserId,
          'type': task.type,
          'code': task.code,
          'date': dateNowStr,
          'status': 0,
          'description': res
        }
        Postcompliance(item)
      }
    })
  }

  // 获取某项任务执行情况
  function GetTaskInfo (task) {
    var res = ''
    var promise = Compliance.getcompliance(task)
    promise.then(function (data) {
      if (data.results) {
        res = data.results.description
      }
         // console.log(data.results);
      ChangeLongFir()// 修改长周期任务第一次执行时间
    }, function () {
    })
    return res
  }

  // 测量输入格式与范围判定
  function AboutRange (value, code) {
    var word = ''
    var num = -1
    var res = {}
    var str = value.replace(/(^\s*)|(\s*$)/g, '')// 去除字符串两端空格
    if (isNaN(str)) {
      word = '请输入数字！'
    } else {
      var num = parseInt(str)
      var range = RangeMatch(code)
      if (!jQuery.isEmptyObject(range)) {
        if ((num < range.Min) || (num > range.Max)) {
          word = '您输入的数值不在正常范围内!'
        }
      }
    }
    res.word = word
    res.num = num
    res.str = str
    return res
  }

  // 提示框
  $scope.showAlert = function () {
    var alertPopup = $ionicPopup.alert({
      title: '提示',
      template: '请注意，您可能患有高血压！'
    })
    alertPopup.then(function (res) {
    })
  }

  // 任务完成后设定下次任务执行时间
  function SetNextTime (LastDate, FreqTimes, Unit, Times) {
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

  // 点击按钮开始新任务
  $scope.StartNewTask = function (task) {
    task.Flag = false
  }

  // 日期延后计算
  function DateCalc (LastDate, Type, Addition) {
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

  $scope.openModal = function (DoctorId) {
    $state.go('tab.DoctorSchedule', {DoctorId: DoctorId})
  }
     // 清除
  $scope.$on('$destroy', function () {
    $scope.modal.remove()
  })

  // 修改日期格式Date → yyyy-mm-dd
  function ChangeTimeForm (date) {
    var nowDay = ''
    if (date instanceof Date) {
      var mon = date.getMonth() + 1
      var day = date.getDate()
      nowDay = date.getFullYear() + '-' + (mon < 10 ? '0' + mon : mon) + '-' + (day < 10 ? '0' + day : day)
    }
    return nowDay
  }

  // 页面刷新
  $scope.Refresh = function () {
    $window.location.reload()
  }

  // 跳转至任务设置页面
  $scope.GotoSet = function () {
    $state.go('tab.taskSet')
  }


  // 血透排班表字典
  $scope.HemoTbl = [
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'},
                     {'background-color': 'white'}
  ]

  // 获取医生排班
  function GetMyDoctors () {
    var promise = Patient.getMyDoctors({userId: UserId})
    promise.then(function (data) {
      if (data.results.doctorId) {
        console.log(data)
        var schedules = data.results.doctorId.schedules
            // console.log(schedules);
        if (schedules) {
          for (var i = 0; i < schedules.length; i++) {
            var num = parseInt(schedules[i].day)
            if (schedules[i].time == '1') {
              num = num + 7
            }
                   // console.log(num);
            $scope.HemoTbl[num]['background-color'] = 'red'
          }
        }
      }
      if (data.results.doctorId.suspendTime.length == 0) {
        $scope.hasstop = false
      } else {
        $scope.dateC = new Date()
        var date = new Date()
        var dateNow = '' + date.getFullYear();
        (date.getMonth() + 1) < 10 ? dateNow += '0' + (date.getMonth() + 1) : dateNow += (date.getMonth() + 1)
        date.getDate() < 10 ? dateNow += '0' + date.getDate() : dateNow += date.getDate()
        console.log(dateNow)

        $scope.begin = data.results.doctorId.suspendTime[0].start
        $scope.end = data.results.doctorId.suspendTime[0].end

        date = new Date($scope.begin)
        var dateB = '' + date.getFullYear();
        (date.getMonth() + 1) < 10 ? dateB += '0' + (date.getMonth() + 1) : dateB += (date.getMonth() + 1)
        date.getDate() < 10 ? dateB += '0' + date.getDate() : dateB += date.getDate()
        date = new Date($scope.end)
        var dateE = '' + date.getFullYear();
        (date.getMonth() + 1) < 10 ? dateE += '0' + (date.getMonth() + 1) : dateE += (date.getMonth() + 1)
        date.getDate() < 10 ? dateE += '0' + date.getDate() : dateE += date.getDate()

        if (dateNow >= dateB && dateNow <= dateE) {
          $scope.hasstop = true
        } else {
          $scope.hasstop = false
        }
      }
    }, function () {
    })
  }
}])

// 任务设置--GL
.controller('TaskSetCtrl', ['$scope', '$state', '$ionicHistory', 'Storage', 'Patient', 'Task', '$ionicPopup', '$ionicLoading', function ($scope, $state, $ionicHistory, Storage, Patient, Task, $ionicPopup, $ionicLoading) {
  // 初始化
  var UserId = Storage.get('UID')
    // UserId = "Test13";
  $scope.Tasks = {}
  $scope.OKBtnFlag = true
  $scope.EditFlag = false
  var dateNowStr = ChangeTimeForm(new Date()) // 方便设定当前日期进行调试，或是之后从数据库获取当前日期
  $scope.$on('$ionicView.enter', function () {
    $scope.noTasks = false
    GetTasks()
  })

  // 获取对应任务模板
  function GetTasks (TaskCode) {
    var promise = Task.getUserTask({userId: UserId})
    promise.then(function (data) {
      console.log(data)
      if (data.result) {
        $scope.noTasks = true
        $scope.Tasks = data.result.task
        console.log($scope.Tasks)
        HandleTasks()
      } else {
        $ionicLoading.show({template: '请您先在个人信息中完善用户信息', duration: 1000})
      }
    })
  }

  // 获取模板后进行处理
  function HandleTasks () {
    $scope.Tasks.Other = []
    $scope.Tasks.Hemo = [] // 血透排班
    $scope.Tasks.Hemo.Flag = false
    for (var i = 0; i < $scope.Tasks.length; i++) {
      var task = $scope.Tasks[i]
      var newTask = []
         // console.log(task);
      if (task.type == 'Measure') {
        $scope.Tasks.Measure = task.details

        for (var j = 0; j < $scope.Tasks.Measure.length; j++) {
          var temp = $scope.Tasks.Measure[j]
          if (temp.frequencyUnits == '天')// 限定每日完成的任务
                {
            $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code)
            $scope.Tasks.Measure[j].Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits
          } else {
            if (temp.code == 'VascularAccess') {
              newTask = $scope.Tasks.Measure[j]
              newTask.type = task.type
              newTask.Name = '血管通路情况'
              newTask.Freq = newTask.frequencyTimes + newTask.frequencyUnits + newTask.times + newTask.timesUnits
              newTask = TimeSelectBind(newTask)
              $scope.Tasks.Other.push(newTask)
              $scope.Tasks.Measure.splice(j, 1)
            }
          }
        }
      } else {
        for (var j = 0; j < task.details.length; j++) {
          newTask = task.details[j]
          if ((task.type == 'ReturnVisit') && (newTask.code == 'stage_9')) // 排除血透排班
                {
            $scope.Tasks.Hemo = newTask
            $scope.Tasks.Hemo.type = task.type
            $scope.Tasks.Hemo.Flag = true
            $scope.Tasks.Hemo.Freq = newTask.frequencyTimes + newTask.frequencyUnits + newTask.times + newTask.timesUnits
                    // console.log($scope.Tasks.Hemo);
            if ((newTask.content != '') && (newTask.content != ' ')) // 修改表格样式
                    {
              var NumArry = newTask.content.split('+')[1].split(',')
              for (var k = 0; k < NumArry.length; k++) {
                $scope.HemoTbl[NumArry[k]].style['background-color'] = 'red'
              }
            }
          } else if (newTask.times == 0) // 排除只执行一次的任务
                {
                    // 暂时不放进来
          } else {
            newTask.type = task.type
            newTask.Name = NameMatch(newTask.type)
            newTask.Freq = newTask.frequencyTimes + newTask.frequencyUnits + newTask.times + newTask.timesUnits
            newTask = TimeSelectBind(newTask)
            $scope.Tasks.Other.push(newTask)
          }
        }
      }
    }
      // console.log($scope.Tasks);
  }

  // 名称转换
  function NameMatch (name) {
    var Tbl = [
                 {Name: '体温', Code: 'Temperature'},
                 {Name: '体重', Code: 'Weight'},
                 {Name: '血压', Code: 'BloodPressure'},
                 {Name: '尿量', Code: 'Vol'},
                 {Name: '心率', Code: 'HeartRate'},
                 {Name: '复诊', Code: 'ReturnVisit'},
                 {Name: '化验', Code: 'LabTest'},
                 {Name: '特殊评估', Code: 'SpecialEvaluate'},
                 {Name: '血管通路情况', Code: 'VascularAccess'},
                 {Name: '腹透', Code: 'PeritonealDialysis'},
                 {Name: '超滤量', Code: 'cll'},
                 {Name: '浮肿', Code: 'ywfz'},
                 {Name: '引流通畅', Code: 'yl'}
    ]
    for (var i = 0; i < Tbl.length; i++) {
      if (Tbl[i].Code == name) {
        name = Tbl[i].Name
        break
      }
    }
    return name
  }

  // 时间下拉框绑定
  function TimeSelectBind (item) {
    var flag = false
    var day
    if (item.startTime != '2050-11-02T07:58:51.718Z') // 已设置过时间，选定的日期应从取得的数据计算
        {
      var date = new Date(item.startTime)
      flag = true
    }
    var Unit = item.frequencyUnits
    if (Unit == '周') {
      item.Days = $scope.Week
      item.Type = 'week'
      if (flag) {
        var day = date.getDay()
        item.SelectedDay = $scope.Week[day]
      } else {
        item.SelectedDay = '星期一' // 默认时间
      }
    } else if (Unit == '月') {
      item.Days = $scope.Days
      item.Type = 'month'
      if (flag) {
        var day = date.getDate()
        item.SelectedDay = $scope.Days[day - 1]
      } else {
        item.SelectedDay = '1日' // 默认时间
      }
    } else if (Unit == '年') {
      item.Days = $scope.Month
      item.Type = 'year'
      if (flag) {
        var day = date.getMonth()
        item.SelectedDay = $scope.Month[day]
      } else {
        item.SelectedDay = '1月' // 默认时间
      }
    }
    return item
  }

  // 时间下拉框数据
  $scope.Week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  $scope.Days = ['1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', '10日', '11日', '12日', '13日', '14日', '15日', '16日', '17日', '18日', '19日', '20日', '21日', '22日', '23日', '24日', '25日', '26日', '27日', '28日']
  $scope.Month = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  // 页面跳转
  $scope.SetDate = function () {
    if ($scope.Tasks.Hemo.Flag) {
      SetHemoDate($scope.Tasks.Hemo)
    }
    for (var i = 0; i < $scope.Tasks.Other.length; i++) {
      var task = $scope.Tasks.Other[i]
      $scope.Tasks.Other.startTime = SetTaskTime(task.SelectedDay, task.frequencyUnits)
      item = {
        'userId': UserId,
        'type': task.type,
        'code': task.code,
        'instruction': task.instruction,
        'content': task.content,
        'startTime': $scope.Tasks.Other.startTime,
        'endTime': task.endTime,
        'times': task.times,
        'timesUnits': task.timesUnits,
        'frequencyTimes': task.frequencyTimes,
        'frequencyUnits': task.frequencyUnits
      }
      UpdateUserTask(item)  // 更改任务下次执行时间
    }
    if ($scope.OKBtnFlag) {
      $ionicHistory.goBack()
        // $state.go('tab.tasklist');
    }
  }

  $scope.Goback = function () {
    console.log('goBack')
    console.log($ionicHistory.backView())
   $ionicHistory.goBack() 
  }

  // 更新用户任务模板
  function UpdateUserTask (task) {
    var promise = Task.updateUserTask(task)
    promise.then(function (data) {
         // console.log(data);
      if (data.results) {
        console.log(data.results)
      };
    }, function () {
    })
  }

  // 选定星期或号数后，默认为离当前日期最近的日期
  function SetTaskTime (SelectedDay, Type) {
      // 暂时就用本地时间
    var CurrentDate = new Date(dateNowStr)
    var NewDate
    var WeekDay = CurrentDate.getDay() // 0-6 0为星期日
    var Day = CurrentDate.getDate() // 1-31
    var Month = CurrentDate.getMonth() // 0-11,0为1月

    var Num = 0
    if (Type == '周') {
      Num = $scope.Week.indexOf(SelectedDay)

      if (Num >= WeekDay) // 所选日期未过，选择本星期
         {
        NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay))
      } else // 下个星期
         {
        NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay))
      }
    } else if (Type == '月') {
      Num = $scope.Days.indexOf(SelectedDay) + 1
      NewDate = new Date(CurrentDate.setDate(Num))
      if (Num < Day) // 所选日期已过，选择下月
         {
        NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1))
      }
    } else if (Type == '年') {
      Num = $scope.Month.indexOf(SelectedDay)
      NewDate = new Date(CurrentDate.setMonth(Num))
      if (Num < Month)// 所选日期已过，选择明年
         {
        NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1))
      }
    }
      // console.log(NewDate);
    return ChangeTimeForm(NewDate)
  }

  // 编辑按钮
  $scope.EnableEdit = function () {
    $('select').attr('disabled', false)
    $scope.EditFlag = true
  }

  // 修改日期格式Date → yyyy-mm-dd
  function ChangeTimeForm (date) {
    var nowDay = ''
    if (date instanceof Date) // 判断是否为日期格式
      {
      var mon = date.getMonth() + 1
      var day = date.getDate()
      nowDay = date.getFullYear() + '-' + (mon < 10 ? '0' + mon : mon) + '-' + (day < 10 ? '0' + day : day)
    }
    return nowDay
  }

  // 血透排班表字典
  $scope.HemoTbl = [
                     {No: 0, style: {'background-color': 'white'}, Day: '星期一'},
                     {No: 1, style: {'background-color': 'white'}, Day: '星期二'},
                     {No: 2, style: {'background-color': 'white'}, Day: '星期三'},
                     {No: 3, style: {'background-color': 'white'}, Day: '星期四'},
                     {No: 4, style: {'background-color': 'white'}, Day: '星期五'},
                     {No: 5, style: {'background-color': 'white'}, Day: '星期六'},
                     {No: 6, style: {'background-color': 'white'}, Day: '星期日'},
                     {No: 7, style: {'background-color': 'white'}, Day: '星期一'},
                     {No: 8, style: {'background-color': 'white'}, Day: '星期二'},
                     {No: 9, style: {'background-color': 'white'}, Day: '星期三'},
                     {No: 10, style: {'background-color': 'white'}, Day: '星期四'},
                     {No: 11, style: {'background-color': 'white'}, Day: '星期五'},
                     {No: 12, style: {'background-color': 'white'}, Day: '星期六'},
                     {No: 13, style: {'background-color': 'white'}, Day: '星期日'}
  ]


  // 点击进行血透排班选择
  $scope.HemoSelect = function (num) {
    if ($scope.EditFlag) {
      var num1
      if ($scope.HemoTbl[num].style['background-color'] == 'white') {
               // 判断是否选中同一天
        if (num >= 7) {
          num1 = num - 7
        } else {
          num1 = num + 7
        }
        if ($scope.HemoTbl[num1].style['background-color'] == 'red') {
          $scope.showAlert('请不要在同一天安排两次血透！')
        } else {
          $scope.HemoTbl[num].style['background-color'] = 'red'
        }
      } else {
        $scope.HemoTbl[num].style['background-color'] = 'white'
      }
    }
  }

  // 血透排班写入数据库
  function SetHemoDate (task) {
    var times = task.times
    var dateStr = ''
    var numStr = ''
    var res = ''
    var count = 0
    for (var i = 0; i < $scope.HemoTbl.length; i++) {
      if ($scope.HemoTbl[i].style['background-color'] == 'red') {
        count++
        numStr = numStr + ',' + i.toString()
        dateStr = dateStr + ',' + SetTaskTime($scope.HemoTbl[i].Day, '周')
      }
    }

    if (count < times) {
      $scope.showAlert('血透排班次数不足')
      $scope.OKBtnFlag = false
    } else if (count > times) {
      $scope.showAlert('血透排班次数过多')
      $scope.OKBtnFlag = false
    } else {
      numStr = numStr.substr(1)
      dateStr = dateStr.substr(1)
      $scope.OKBtnFlag = true
      res = dateStr + '+' + numStr
      var item = {
        'userId': UserId,
        'type': task.type,
        'code': task.code,
        'instruction': task.instruction,
        'content': res,
        'startTime': task.startTime,
        'endTime': task.endTime,
        'times': task.times,
        'timesUnits': task.timesUnits,
        'frequencyTimes': task.frequencyTimes,
        'frequencyUnits': task.frequencyUnits
      }
      UpdateUserTask(item)  // 更改任务下次执行时间
    }
  }

  // 血透次数选择
  $scope.HemoTimesOptions = [2, 3]
   /* $scope.SetHemoTimes = function(times)
   {
      $scope.Tasks.Hemo.times = times;
      console.log($scope.Tasks.Hemo.times);
   } */

  // 提示对话框
  $scope.showAlert = function (words) {
    var alertPopup = $ionicPopup.alert({
      title: '提示',
      template: words
    })
    alertPopup.then(function (res) {
    })
  }
}])

// 我的 页面--PXY
.controller('MineCtrl', ['User', '$ionicActionSheet','$interval', 'News', '$scope', '$ionicHistory', '$state', '$ionicPopup', '$resource', 'Storage', 'CONFIG', '$ionicLoading', '$ionicPopover', 'Camera', 'Patient', 'Upload', '$sce', 'mySocket', 'socket', 'Mywechatphoto', 'Mywechat', '$location', '$timeout', function (User, $ionicActionSheet,$interval, News, $scope, $ionicHistory, $state, $ionicPopup, $resource, Storage, CONFIG, $ionicLoading, $ionicPopover, Camera, Patient, Upload, $sce, mySocket, socket, Mywechatphoto, Mywechat, $location, $timeout) {
  // Storage.set("personalinfobackstate","mine")

  var patientId = Storage.get('UID')
  var GetUnread = function () {
      // console.log(new Date());
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: Number(0), userRole: 'patient'}).then(
      function (data) {
          // console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
              // console.log($scope.HasUnreadMessages);
        } else {
          $scope.HasUnreadMessages = false
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
       $interval.cancel(RefreshUnread)
    }
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 60000)
  })

  $scope.$on('$ionicView.leave', function () {
    console.log('destroy')
    $interval.cancel(RefreshUnread)
  })
  // 页面跳转---------------------------------
  $scope.GoUserDetail = function () {
    $state.go('userdetail', {last: 'mine'})
  }
  $scope.GoDiagnosiInfo = function () {
    $state.go('tab.DiagnosisInfo')
  }
  $scope.GoConsultRecord = function () {
    $state.go('tab.myConsultRecord')
  }
  $scope.GoReports = function(){
    $state.go('tab.Reports')
  }
  $scope.GoHealthInfo = function () {
    $state.go('tab.myHealthInfo')
  }
  $scope.GoManagement = function () {
    $state.go('tab.taskSet')
  }
  // $scope.GoDevices = function () {
  //   console.log('tab.devices')
  //   $state.go('tab.devices')
  // }

  $scope.GoMoney = function () {
    $state.go('tab.myMoney')
  }

  $scope.PaperCollection = function () {
    $ionicLoading.show({
      template: '程序猿正努力中，请耐心等待！',
      duration:1500,
      hideOnStateChange: true
    })
  }

  $scope.SignOut = function () {
    // $scope.navigation_login = $sce.trustAsResourceUrl('http://patientdiscuss.haihonghospitalmanagement.com/member.php?mod=logging&action=logout&formhash=xxxxxx')
    var myPopup = $ionicPopup.show({
      template: '<center>确定要退出登录吗?</center>',
      title: '退出',
            // subTitle: '2',
      scope: $scope,
      buttons: [
        { text: '取消',
          type: 'button-small',
          onTap: function (e) {
          }
        },
        {
          text: '确定',
          type: 'button-small button-positive',
          onTap: function(e){
              User.logOut().then(function(data){
                $state.go('signin')
                Storage.rm('TOKEN')
                var USERNAME = Storage.get('USERNAME')
                Storage.clear()
                        // Storage.rm('patientunionid');
                        // Storage.rm('PASSWORD');
                Storage.set('USERNAME', USERNAME)
                mySocket.cancelAll()
                socket.emit('disconnect')
                socket.disconnect()
                         // $timeout(function () {
                $ionicHistory.clearCache()
                $ionicHistory.clearHistory()
            },function(err){
            })
          }
        }
      ]
    })
  }

 //二维码
  Patient.getPatientDetail({userId: Storage.get('UID')}).then(
    function (data) {
      $scope.patient = data.results
      // console.log($scope.patient)
      // console.log($scope.patient.patTDCticket)
      if ( $scope.patient.patTDCticket == null || $scope.patient.patTDCticket == undefined) {
        // console.log("yes")
        var params = {
          'role':"doctor",
          'userId': Storage.get('UID'),
          'postdata': {
            'action_name': 'QR_LIMIT_STR_SCENE',
            'action_info': {
              'scene': {
                'scene_str': Storage.get('UID')
              }
            }
          }
        }
        Mywechatphoto.createTDCticket(params).then(function (data) {
          $scope.patient.patTDCticket = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + data.results.patTDCticket
        },
            function (err) {
              console.log(err)
            })
      } else {
        // console.log("no")
        $scope.patient.patTDCticket = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + $scope.patient.patTDCticket
      }
    },
    function (err) {
      console.log(err)
    }
)

  $scope.ReflectAdvice = function () {
    $state.go('tab.advice')
  }

  $scope.About = function () {
    $state.go('tab.about')
  }

  $scope.ChangePassword = function () {
    $state.go('tab.changePassword')
  }
    // $scope.myAvatar = ""
    // 根据用户ID查询用户头像
  $scope.myAvatar = 'img/DefaultAvatar.jpg'
  Patient.getPatientDetail({userId: Storage.get('UID')}).then(function (res) {
    // console.log(res)
        // console.log(res.results)
        // console.log(res.results.photoUrl)
        // console.log(angular.fromJson(res.results))
    if (res.results) {
            // console.log(res.results);
      $scope.myName = res.results.name
      $scope.myPhone = res.results.phoneNo
      if (res.results.photoUrl && res.results.photoUrl != 'http://pp.jpg') {
        $scope.myAvatar = res.results.photoUrl
      }
    }
  })

  // var Picturepath=Storage.get("myAvatarpath")
  // if(Picturepath==""||Picturepath==null){
  //   $scope.myAvatar="img/DefaultAvatar.jpg"
  // }else{
  //   $scope.myAvatar=Picturepath;
  // }


  $scope.reload = function () {
    var t = $scope.myAvatar
    $scope.myAvatar = ''

    $scope.$apply(function () {
      $scope.myAvatar = t
    })
  }

 // 上传照片并将照片读入页面-------------------------
  // var photo_upload_display = function (imgURI) {
  //  // 给照片的名字加上时间戳
  //   var temp_photoaddress = Storage.get('UID') + '_' + 'myAvatar.jpg'
  //   console.log(temp_photoaddress)
  //   Camera.uploadPicture(imgURI, temp_photoaddress)
  //   .then(function (res) {
  //     var data = angular.fromJson(res)
  //     // res.path_resized
  //     // 图片路径
  //     $scope.myAvatar = CONFIG.mediaUrl + String(data.path_resized) + '?' + new Date().getTime()
  //     console.log($scope.myAvatar)
  //     // $state.reload("tab.mine")
  //     // Storage.set('myAvatarpath',$scope.myAvatar);
  //     Patient.editPatientDetail({userId: Storage.get('UID'), photoUrl: $scope.myAvatar}).then(function (r) {
  //       console.log(r)
  //     })
  //   }, function (err) {
  //     console.log(err)
  //     reject(err)
  //   })
  // }
  var photo_upload_display = function(serverId){
    $ionicLoading.show({
        template:'头像更新中',
        duration:5000
    })
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("UID") + "_" +  "myAvatar.jpg";
    console.log(temp_photoaddress)
    var temp_name = 'resized' + Storage.get("UID") + "_" +  "myAvatar.jpg";
    Mywechat.download({serverId:serverId, name:temp_name})
    .then(function(res){
      //res.path_resized
      $timeout(function(){
          $ionicLoading.hide();
          //图片路径
          $scope.myAvatar=CONFIG.mediaUrl + "uploads/photos/"+temp_name+'?'+new Date().getTime();
          console.log($scope.myAvatar)
          // $state.reload("tab.mine")
          Patient.editPatientDetail({userId:Storage.get("UID"),photoUrl:$scope.myAvatar}).then(function(r){
            console.log(r);
          })
      },1000)
      
    },function(err){
      console.log(err);
      reject(err);
    })
  };
  // -----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        // --------------------------------------------
        // .fromTemplateUrl() method
  $ionicPopover.fromTemplateUrl('partials/pop/cameraPopover.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (popover) {
    $scope.popover = popover
  })
  $scope.openPopover = function ($event) {
    $scope.popover.show($event)
  }
  $scope.closePopover = function () {
    $scope.popover.hide()
  }
  // Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function () {
    $scope.popover.remove()
  })
  // Execute action on hide popover
  $scope.$on('popover.hidden', function () {
    // Execute action
  })
  // Execute action on remove popover
  $scope.$on('popover.removed', function () {
    // Execute action
  })

// 相册键的点击事件---------------------------------
  function onClickCameraPhotos() {
   // console.log("选个照片");
    $scope.choosePhotos()
    $scope.closePopover()
  }
  // $scope.choosePhotos = function () {
  //   Camera.getPictureFromPhotos('gallery').then(function (data) {
  //       // data里存的是图像的地址
  //       // console.log(data);
  //     var imgURI = data
  //     photo_upload_display(imgURI)
  //   }, function (err) {
  //       // console.err(err);
  //     var imgURI
  //   })// 从相册获取照片结束
  // } // function结束
$scope.choosePhotos = function() {
    var config = "";
    var path = $location.absUrl().split('#')[0]
    Mywechat.settingConfig({url:path}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['chooseImage','uploadImage']
      // alert(config.jsApiList)
      // alert(config.debug)
      console.log(angular.toJson(config))
      wx.config({
        debug:false,
        appId:config.appId,
        timestamp:config.timestamp,
        nonceStr:config.nonceStr,
        signature:config.signature,
        jsApiList:config.jsApiList
      })
      wx.ready(function(){
        wx.checkJsApi({
            jsApiList: ['chooseImage','uploadImage'],
            success: function(res) {
                wx.chooseImage({
                  count:1,
                  sizeType: ['original','compressed'],
                  sourceType: ['album'],
                  success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                  }
                })
            }
        });
      })
      wx.error(function(res){
        alert(res.errMsg)
      })

    },function(err){

    })
  }; // function结束
    // 照相机的点击事件----------------------------------
  function getPhoto() {
      // console.log("要拍照了！");
    $scope.takePicture()
    $scope.closePopover()
  }
  $scope.isShow = true
  // $scope.takePicture = function () {
  //   Camera.getPicture('cam').then(function (data) {
  //     console.log(data)
  //     photo_upload_display(data)
  //   }, function (err) {
  //         // console.err(err);
  //     var imgURI
  //   })// 照相结束
  // } // function结束
  $scope.takePicture = function() {
      var config = "";
      var path = $location.absUrl().split('#')[0]
      Mywechat.settingConfig({url:path}).then(function(data){
        // alert(data.results.timestamp)
        config = data.results;
        config.jsApiList = ['chooseImage','uploadImage']
        // alert(config.jsApiList)
        // alert(config.debug)
        console.log(angular.toJson(config))
        wx.config({
          debug:false,
          appId:config.appId,
          timestamp:config.timestamp,
          nonceStr:config.nonceStr,
          signature:config.signature,
          jsApiList:config.jsApiList
        })
        wx.ready(function(){
          wx.checkJsApi({
          jsApiList: ['chooseImage','uploadImage'],
          success: function(res) {
              wx.chooseImage({
                count:1,
                sizeType: ['original','compressed'],
                sourceType: ['camera'],
                success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                }
              })
          }
          });
        })
      wx.error(function(res){
        alert(res.errMsg)
      })

      },function(err){

      })
    }; // function结束

  // 上传头像的点击事件----------------------------
  $scope.onClickCamera = function ($event) {
    $ionicActionSheet.show({
     buttons: [
       { text: '拍照' },
       { text: '从相册选择' }
     ],
     cancelOnStateChange: true,
     // titleText: '上传头像',
     buttonClicked: function(index) {
      if(index===0){
        getPhoto()
      }else{
        onClickCameraPhotos()
      }
       return true;
     }
   })
    // $scope.openPopover($event)
  }
}])

// 诊断信息
.controller('DiagnosisCtrl', ['Dict', '$scope', '$ionicHistory', '$state', '$ionicPopup', '$resource', 'Storage', 'CONFIG', '$ionicLoading', '$ionicPopover', 'Camera', 'Patient', 'Upload', function (Dict, $scope, $ionicHistory, $state, $ionicPopup, $resource, Storage, CONFIG, $ionicLoading, $ionicPopover, Camera, Patient, Upload) {
  
    // 过滤重复的医生诊断 顺序从后往前，保证最新的一次诊断不会被过滤掉
  var FilterDiagnosis = function (arr) {
    var result = []
    var hash = {}
    for (var i = arr.length - 1; i >= 0; i--) {
      var elem = arr[i].doctor.userId
      if (!hash[elem]) {
        result.push(arr[i])
        hash[elem] = true
      }
    }
    return result
  }

  var RefreshDiagnosisInfo = function () {
    $scope.noDiags = false
    Patient.getPatientDetail({userId: Storage.get('UID')}).then(// userId:Storage.get('UID')
        function (data) {
          console.log(data.results)
          if (data.results.class) {
            if (data.results.diagnosisInfo.length) {
              var allDiags = data.results.diagnosisInfo
              console.log(allDiags)
              var DoctorDiags = FilterDiagnosis(allDiags)
                // console.log(DoctorDiags);
              Dict.getDiseaseType({category: 'patient_class'}).then(
                    function (data) {
                      $scope.Diseases = data.results[0].content
                      $scope.Diseases.push($scope.Diseases[0])
                      $scope.Diseases.shift()
                      console.log($scope.Diseases)
                      for (var i = 0; i < DoctorDiags.length; i++) {
                        if (DoctorDiags[i].name != null) {
                            // console.log(i);
                            // console.log(DoctorDiags[i].name);
                            // DoctorDiags[i].name = searchObj(DoctorDiags[i].name,$scope.Diseases);
                            // DoctorDiags[i].hypertension = searchObj(DoctorDiags[i].hypertension,$scope.Hypers);
                          if (DoctorDiags[i].name == 'class_5') {
                            DoctorDiags[i].showProgress = false
                            DoctorDiags[i].showSurgicalTime = true
                            DoctorDiags[i].timename = '插管日期'
                          } else if (DoctorDiags[i].name == 'class_1') {
                            DoctorDiags[i].showProgress = false
                            DoctorDiags[i].showSurgicalTime = true
                            DoctorDiags[i].timename = '手术日期'
                          } else if (DoctorDiags[i].name == 'class_6') {
                            DoctorDiags[i].showProgress = false
                            DoctorDiags[i].showSurgicalTime = true
                            DoctorDiags[i].timename = '开始日期'
                          } else if (DoctorDiags[i].name == 'class_4') {
                            DoctorDiags[i].showProgress = false
                            DoctorDiags[i].showSurgicalTime = false
                          } else {
                            DoctorDiags[i].showProgress = true
                            DoctorDiags[i].showSurgicalTime = false
                            DoctorDiags[i].DiseaseDetails = DoctorDiags[i].name.details
                            console.log(DoctorDiags[i].DiseaseDetails)
                              // if(DoctorDiags[i].DiseaseDetails!=undefined){
                              //   DoctorDiags[i].progress = searchObj(DoctorDiags[i].progress,DoctorDiags[i].DiseaseDetails);
                              // }
                          }
                        }
                      }
                      $scope.Diags = DoctorDiags

                      // console.log($scope.Diseases)
                    },
                    function (err) {
                      console.log(err)
                    }
                  )
            } else {
              $scope.noDiags = true
            }
          } else {
            $ionicLoading.show({template: '请您先在个人信息中完善用户信息', duration: 1000})
          }
        }, function (err) {
      console.log(err)
    })
  }
  $scope.$on('$ionicView.enter', function () {
    RefreshDiagnosisInfo()
  })

  $scope.do_refresher = function () {
    RefreshDiagnosisInfo()
    $scope.$broadcast('scroll.refreshComplete')
  }
}])
// 咨询记录--PXY
.controller('ConsultRecordCtrl', ['News', 'Patient', 'Storage', '$scope', '$state', '$ionicHistory', '$ionicLoading', '$ionicPopover', 'Counsels', '$ionicPopup', '$rootScope', function (News, Patient, Storage, $scope, $state, $ionicHistory, $ionicLoading, $ionicPopover, Counsels, $ionicPopup, $rootScope) {
  $scope.Goback = function(){
    $state.go('tab.myDoctors')
  }

  $scope.noConsult = false

    // 过滤重复的医生 顺序从后往前，保证最新的一次咨询不会被过滤掉
  var FilterDoctor = function (arr) {
    var result = []
    var hash = {}
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i].doctorId) {
        var elem = arr[i].doctorId.userId
        if (!hash[elem]) {
          arr[i].doctorId.lastMsgDate = arr[i].time
          result.push(arr[i].doctorId)
          hash[elem] = true
        }
      }
    }
    return result
  }

  var RefreshCounSelRecords = function () {
    var MyId = Storage.get('UID')
    var promise = Patient.getCounselRecords({userId: MyId})
    promise.then(function (data) {
      console.log(data)
      if (data.results.length) {
        FilteredDoctors = FilterDoctor(data.results)
                // console.log(FilteredDoctors);
        News.getNews({userId: MyId, type: 11,userRole:'patient'}).then(
                    function (data) {
                      console.log(data.results)
                      if (data.results) {
                        for (x in FilteredDoctors) {
                          for (y in data.results) {
                            if (FilteredDoctors[x].userId == data.results[y].sendBy || FilteredDoctors[x].userId == data.results[y].userId) {
                              FilteredDoctors[x].lastMsgDate = data.results[y].time 
                              FilteredDoctors[x].latestMsg = data.results[y].description
                              try {
                                data.results[y].url = JSON.parse(data.results[y].url)

                                FilteredDoctors[x].readOrNot = data.results[y].readOrNot || (MyId === data.results[y].url.fromID ? 1 : 0)
                                console.log(FilteredDoctors[x].readOrNot)
                                console.log(data.results[y].url)
                              } catch (e) {
                                            // console.log('error');
                                            // console.log(data.results[y].url);
                                FilteredDoctors[x].readOrNot = 1
                              }
                            }
                          }
                        }
                      }
                      $scope.items = FilteredDoctors
                      console.log(FilteredDoctors)
                    }, function (err) {
          console.log(err)
        }
                )
                // setSingleUnread(FilteredDoctors)
                // .then(function(doctors){
                //     $scope.items=doctors;
                // });
      } else {
        $scope.noConsult = true
      }
    }, function (err) {
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    RefreshCounSelRecords()
  })

  $scope.do_refresher = function () {
    RefreshCounSelRecords()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.getConsultRecordDetail = function (ele, doctorId) {
    var template = ''
    var counseltype = 0
    var counselstatus = ''

    if (ele.target.nodeName == 'IMG') {
      $state.go('tab.DoctorDetail', {DoctorId: doctorId})
    } else {
        // zz最新方法根据docid pid 不填写type获取最新一条咨询信息
      Counsels.getStatus({doctorId: doctorId, patientId: Storage.get('UID')})
        .then(function (data) {
          console.log(data.result)
          console.log(data.result.type)
          console.log(data.result.status)
          if (data.result.type == 1) {
            if (data.result.status == 1) { // 有尚未完成的咨询 直接进入
              $ionicPopup.confirm({
                title: '咨询确认',
                template: '您有尚未结束的咨询，点击确认可以查看历史消息，在医生完成三次问答之前，您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '咨询确认',
                template: '您的咨询已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          } else if (data.result.type == 2 || data.result.type == 3) {
            if (data.result.status == 1) { // 尚未结束的问诊
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您有尚未结束的问诊，点击确认可以查看历史消息，在医生结束该问诊之前您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您的问诊已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          } else if (data.result.type == 6 || data.result.type == 7) {
            if (data.result.status == 1) { // 尚未结束的加急咨询
              $ionicPopup.confirm({
                title: '加急咨询确认',
                template: '您有尚未结束的加急咨询，点击确认可以查看历史消息，在医生结束之前您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '加急咨询确认',
                template: '您的加急咨询已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  counseltype
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          }
        })
    }
  }
}])

/**
 * 聊天页面
 * @Author   xjz
 * @DateTime 2017-07-05
 */
.controller('ChatCtrl', ['$ionicPlatform', '$scope', '$state', '$rootScope', '$ionicModal', '$ionicScrollDelegate', '$ionicHistory', 'Camera', 'voice', 'CONFIG', '$ionicPopup', 'Counsels', 'Storage', 'Mywechat', '$q', 'Communication', 'Account', 'News', '$ionicLoading', 'Patient', 'arrTool', 'socket', 'notify', '$timeout', '$location', function ($ionicPlatform, $scope, $state, $rootScope, $ionicModal, $ionicScrollDelegate, $ionicHistory, Camera, voice, CONFIG, $ionicPopup, Counsels, Storage, Mywechat, $q, Communication, Account, News, $ionicLoading, Patient, arrTool, socket, notify, $timeout, $location) {
  // if ($ionicPlatform.is('ios')) cordova.plugins.Keyboard.disableScroll(true)
  $scope.input = {
    text: ''
  }
  $scope.scrollHandle = $ionicScrollDelegate.$getByHandle('myContentScroll')
  var path = $location.absUrl().split('#')[0]
  var config = ''
  /**
   * 拉到底的动画效果
   * @Author   xjz
   * @DateTime 2017-07-05
   */
  function toBottom(animate,delay){
        if(!delay) delay=100;
        $timeout(function(){
            $scope.scrollHandle.scrollBottom(animate);
            $timeout(function(){
                $scope.scrollHandle.resize();
            },500);
            $timeout(function(){
                $scope.scrollHandle.resize();
            },1000);
        },delay)
    }
  // 进入页面前：
  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.timer = []
    $scope.photoUrls = {}
    $scope.msgs = []
    $scope.imgIndex = 0  // 当前显示的图片在消息队列中的位置
    $scope.imgPosition = 0
    $scope.params = {
      msgCount: 0,
      helpDivHeight: 0,
      hidePanel: true,
      moreMsgs: true,
      UID: Storage.get('UID'),
      chatId: $state.params.chatId,
      counselcount: 0,
      counseltype: '',
      counselstatus: '',
      needlisten: 0,
      counsel: '',
      loaded: false,
      recording: false
    }
    try {
      notify.remove($scope.params.chatId)
    } catch (e) {}
    var loadWatcher = $scope.$watch('msgs.length', function (newv, oldv) {
      if (newv) {
        loadWatcher()

        // var lastMsg = $scope.msgs[$scope.msgs.length - 1]
        // if (lastMsg.fromID == $scope.params.UID) return
        // return News.insertNews({userId: $state.params.chatId, type: '11', userRole:'patient', readOrNot: 1}) 
        return News.setReadOrNot({ sendBy: $scope.params.chatId, type: 11 })
      }
    })
  })
  // 进入页面时：获取咨询状态、剩余次数
  $scope.$on('$ionicView.enter', function () {
    // if ($ionicPlatform.is('ios') == false)document.getElementById('inputbar').removeAttribute('keyboard-attach')
    //   console.log(document.getElementById('inputbar'))
    // $rootScope.conversation.type = 'single'
    // $rootScope.conversation.id = $state.params.chatId
    Counsels.getStatus({doctorId: $state.params.chatId, patientId: Storage.get('UID')})
            .then(function (data) {
              console.log('进入页面getstatus ')
              console.log(data)
              $scope.params.counseltype = data.result.type == '3' ? '2' : (data.result.type == '7' ? '6' : data.result.type)
              $scope.params.counsel = data.result
              $scope.counselstatus = data.result.status

              Account.getCounts({doctorId: $scope.params.chatId, patientId: Storage.get('UID')})
                .then(function (res) {
                  console.log('进入页面getcounts ')
                  console.log(res)
                  if ($scope.params.loaded) {
                    return sendNotice($scope.params.counseltype, $scope.counselstatus, res.result.count)
                  } else {
                    var connectWatcher = $scope.$watch('params.loaded', function (newv, oldv) {
                      if (newv) {
                        connectWatcher()
                        return sendNotice($scope.params.counseltype, $scope.counselstatus, res.result.count)
                      }
                    })
                  }
                })
            }, function (err) {
              console.log(err)
            })
            // 显示头像
    Patient.getDoctorLists({doctorId: $state.params.chatId})
            .then(function (data) {
              console.log('医生头像',data.results)
              $scope.photoUrls[data.results[0].userId] = data.results[0].photoUrl
            })
    Patient.getPatientDetail({ userId: $scope.params.UID })
        .then(function (response) {
           console.log('患者头像',response.results)
          thisPatient = response.results
          $scope.photoUrls[response.results.userId] = response.results.photoUrl
        }, function (err) {

        })
    Mywechat.settingConfig({ url: path }).then(function (data) {
      config = data.results
      config.jsApiList = ['startRecord', 'stopRecord', 'playVoice', 'chooseImage', 'uploadVoice', 'uploadImage']
      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: config.jsApiList
      })
      wx.error(function (res) {
        console.error(res)
        alert(res.errMsg)
      })
    })
    imgModalInit()
    // 先显示15条
    $scope.getMsg(15).then(function (data) {
      $scope.msgs = data
      $scope.params.loaded = true
      toBottom(true, 1000)
    })
  })
  // 离开页面时：
  $scope.$on('$ionicView.leave', function () {
    for (var i in $scope.timer) clearTimeout($scope.timer[i])
    $scope.msgs = []
    if ($scope.modal)$scope.modal.remove()
    // $rootScope.conversation.type = null
    // $rootScope.conversation.id = ''
  })
  // 显示键盘
  $scope.$on('keyboardshow', function (event, height) {
    $scope.params.helpDivHeight = height
    toBottom(true, 100)
    // setTimeout(function () {
    //   $scope.scrollHandle.scrollBottom()
    // }, 100)
  })
  // 收起键盘
  $scope.$on('keyboardhide', function (event) {
    $scope.params.helpDivHeight = 0
    $scope.scrollHandle.resize()
  })
  $scope.$on('im:getMsg', function (event, data) {
    console.info('getMsg')
    console.log(data)
    if (data.msg.targetType == 'single' && data.msg.fromID == $state.params.chatId) {
      $scope.$apply(function () {
        insertMsg(data.msg)
      })
      // News.insertNews({userId: $state.params.chatId, type: '11', userRole:'patient', readOrNot: 1})
      News.setReadOrNot({ sendBy: $scope.params.chatId, type: 11})
      setTimeout(function () {
        Counsels.getStatus({ doctorId: $state.params.chatId, patientId: Storage.get('UID')})
                    .then(function (data) {
                      console.log('收到消息getstatus ')
                      console.log(data)
                      $scope.counselstatus = data.result.status
                    }, function (err) {
                      console.log(err)
                    })
      }, 1500)
    }
  })
  $scope.$on('im:messageRes', function (event, data) {
    console.info('messageRes')
    console.log(data)
    if (data.msg.targetType == 'single' && data.msg.targetID == $state.params.chatId) {
 var temppos = arrTool.indexOf($scope.msgs, 'createTimeInMillis', data.msg.createTimeInMillis)
      if (!(temppos != -1 && $scope.msgs[temppos].status == 'send_success')) {
        console.log('newMsg')
      $scope.$apply(function () {
        insertMsg(data.msg)
      })
    }
  }
  })
  /**
   * 事件：点击重发
   * @Author   zyh
   * @DateTime 2017-09-30
   * @param    {object}   event    事件
   * @param    {array}    args     ['resend',msg.createTimeInMillis]
   * @return   {null}
   */
  $scope.$on('resend', function (event, args) {
    event.stopPropagation()
    $scope.resendid = args[1]
    console.log(args)
    var pos = arrTool.indexOf($scope.msgs, 'createTimeInMillis', args[1])
    if (pos != -1 && $scope.msgs[pos].status == 'send_fail') $scope.msgs[pos].status = 'send_going'
    socket.emit('message', {msg: $scope.msgs[pos], to: $scope.params.chatId, role: 'doctor'})
    $timeout(function () {
      if (pos != -1 && $scope.msgs[pos].status == 'send_going') $scope.msgs[pos].status = 'send_fail'
    }, 10000)
    // insertMsg($scope.msgs[pos])
  })
  // 点击图片
  $scope.$on('image', function (event, args) {
    console.log(args)
    event.stopPropagation()
    $scope.imageHandle.zoomTo(1, true)
    $scope.imgIndex = $scope.msgs.indexOf(args[2])
    $scope.imgPosition = $scope.imgIndex
    $scope.imageUrl = args[2].content.localPath || (CONFIG.mediaUrl + (args[2].content.src || args[2].content.src_thumb))
    $scope.modal.show()
  })
  // 点击语音
  $scope.$on('voice', function (event, args) {
    console.log(args)
    event.stopPropagation()
    $scope.sound = new Media(args[1],
            function () {
                // resolve(audio.media)
            },
            function (err) {
              console.log(err)
                // reject(err);
            })
    $scope.sound.play()
  })
  // 点击头像
  $scope.$on('profile', function (event, args) {
    event.stopPropagation()
    if (args[1].direct == 'receive') {
      $state.go('tab.DoctorDetail', {DoctorId: args[1].fromID})
    }
  })
  // 监听点击评价的事件
  $scope.$on('gopingjia', function (event, args) {
    event.stopPropagation();
    var content = args[1].content;
    if(content.counselId){
        $state.go('tab.consult-comment',{counselId:content.counselId,doctorId:content.docId,patientId:$scope.params.UID});
    }
  })
  //监听点击继续付费的事件
  $scope.$on('nextPay', function (event, args) {
    event.stopPropagation();
    var content = args[1].content;
    $state.go('tab.DoctorDetail', {DoctorId: content.docId})
  })
  function sendNotice (type, status, cnt) {
        // var t = setTimeout(function(){
    return sendCnNotice(type, status, cnt)
        // },2000);
        // $scope.timer.push(t);
  }
  function sendCnNotice (type, status, cnt) {
    var len = $scope.msgs.length
    if (len == 0 || !($scope.msgs[len - 1].content.type == 'count-notice' && $scope.msgs[len - 1].content.count == cnt)) {
      var bodyDoc = ''
      if (type == '2') {
        if (status == '0') {
          bodyDoc = '您仍可以向患者追加回答，该消息不计费'
          bodyPat = '您没有提问次数了。如需提问，请新建咨询或问诊'
        } else {
          bodyDoc = '患者对您进行问诊，询问次数不限，如您认为回答结束，请点击右上角结束。请在24小时内回复患者。'
          bodyPat = '您询问该医生的次数不限，最后由医生结束此次问诊，请尽量详细描述病情和需求。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。'
        }
      }else if (type == '6') { //加急咨询
        if (cnt <= 0 || status == '0') {
          bodyDoc = '您仍可以向患者追加回答，该消息不计费'
          bodyPat = '您没有提问次数了。如需提问，请新建咨询或问诊'
        } else {
          bodyDoc = '您还需要回答' + cnt + '个问题'
          bodyPat = '您还有' + cnt + '次提问机会'
          if (cnt == 3) {
            bodyDoc = '患者对您进行加急咨询，请在2小时内回复患者，您最多需做三次回答，答满三次后，本次咨询结束；如不满三个问题，2小时后本次咨询关闭。您还需要回答' + cnt + '个问题。'
            bodyPat = '根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，2小时后本次咨询关闭。医生会在2小时内回答，如超过2小时医生未作答，本次咨询关闭，且不收取费用。您还有' + cnt + '次提问机会。'
          }
        }
      } else {
        if (cnt <= 0 || status == '0') {
          bodyDoc = '您仍可以向患者追加回答，该消息不计费'
          bodyPat = '您没有提问次数了。如需提问，请新建咨询或问诊'
        } else {
          bodyDoc = '您还需要回答' + cnt + '个问题'
          bodyPat = '您还有' + cnt + '次提问机会'
          if (cnt == 3) {
            bodyDoc = '患者对您进行咨询，您最多需做三次回答，答满三次后，本次咨询结束；如不满三个问题，24小时后本次咨询关闭。请在24小时内回复患者。您还需要回答' + cnt + '个问题。'
            bodyPat = '根据您提供的问题及描述，医生最多做三次回答，答满三次后，本次咨询结束，请尽量详细描述病情和需求；如不满三个问题，24小时后本次咨询关闭。医生会在24小时内回答，如超过24小时医生未作答，本次咨询关闭，且不收取费用。您还有' + cnt + '次提问机会。'
          }
        }
      }

      var notice = {
        type: 'count-notice',
        ctype: type,
        cstatus: status,
        count: cnt,
        bodyDoc: bodyDoc,
        bodyPat: bodyPat,
        counseltype: type
      }
      var msgJson = {
        contentType: 'custom',
        fromID: $scope.params.UID,
        fromName: thisPatient.name,
        fromUser: {
                    // avatarPath:CONFIG.mediaUrl+'uploads/photos/resized'+$scope.params.UID+'_myAvatar.jpg'
        },
        targetID: $scope.params.chatId,
        targetName: $scope.params.counsel.doctorId.name,
        targetType: 'single',
        status: 'send_going',
        createTimeInMillis: Date.now(),
        newsType: 11,
        targetRole: 'doctor',
        content: notice
      }
            // socket.emit('message',{msg:msgJson,to:$scope.params.chatId,role:'patient'});
            // $scope.pushMsg(msgJson);
      $scope.msgs.push(msgJson)
    }
  }
  $scope.getMsg = function (num) {
    console.info('getMsg')
    return $q(function (resolve, reject) {
      var q = {
        messageType: '1',
        newsType: 11,
        id1: Storage.get('UID'),
        id2: $scope.params.chatId,
        skip: $scope.params.msgCount,
        receiverRole:'doctor',
        sendByRole: 'patient',
        limit: num
      }
      Communication.getCommunication(q)
                .then(function (data) {
                  console.log(data)
                  var d = data.results
                  $scope.$broadcast('scroll.refreshComplete')
                  if (d == '没有更多了!') return noMore()
                  var res = []
                  for (var i in d) {
                    res.push(d[i].content)
                  }
                  if (res.length == 0) $scope.params.moreMsgs = false
                  else {
                    $scope.params.msgCount += res.length
                    if ($scope.msgs.length != 0) $scope.msgs[0].diff = ($scope.msgs[0].time - res[0].time) > 300000
                    for (var i = 0; i < res.length - 1; ++i) {
                      if (res[i].contentType == 'image') res[i].content.thumb = CONFIG.mediaUrl + res[i].content['src_thumb']
                      res[i].direct = res[i].fromID == $scope.params.UID ? 'send' : 'receive'
                      res[i].diff = (res[i].time - res[i + 1].time) > 300000
                      $scope.msgs.unshift(res[i])
                    }
                    res[i].direct = res[i].fromID == $scope.params.UID ? 'send' : 'receive'
                    res[i].diff = true
                    $scope.msgs.unshift(res[i])
                  }
                  console.log($scope.msgs)
                  resolve($scope.msgs)
                }, function (err) {
                  $scope.$broadcast('scroll.refreshComplete')
                  resolve($scope.msgs)
                })
    })
  }
  // 没有更多消息了
  function noMore () {
    $scope.params.moreMsgs = false
    setTimeout(function () {
      $scope.$apply(function () {
        $scope.params.moreMsgs = true
      })
    }, 5000)
  }
  // 多显示15条
  $scope.DisplayMore = function () {
    $scope.getMsg(15).then(function (data) {
      $scope.msgs = data
    })
  }
  $scope.scrollBottom = function () {
    $scope.scrollHandle.scrollBottom(true)
    toBottom(true, 500)
  }

  // 查看图片
  function imgModalInit () {
    $scope.zoomMin = 1
    $scope.imageUrl = ''
    $scope.sound = {}
    $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal
      $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle')
    })
  }

  $scope.closeModal = function () {
    $scope.imageHandle.zoomTo(1, true)
    $scope.modal.hide()
        // $scope.modal.remove()
  }
  $scope.switchZoomLevel = function () {
    if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin) { $scope.imageHandle.zoomTo(1, true) } else {
      $scope.imageHandle.zoomTo(5, true)
    }
  }
  $scope.onSwipeRight = function () {
    if ($scope.imageHandle.getScrollPosition().zoom === $scope.zoomMin) {  // 没有缩放时才允许切换
      $scope.imgIndex--
      if ($scope.imgIndex >= 0) {
        if ($scope.msgs[$scope.imgIndex].contentType === 'image') {
          $scope.imgPosition = $scope.imgIndex
          $scope.imageUrl = (CONFIG.mediaUrl + ($scope.msgs[$scope.imgIndex].content.src || $scope.msgs[$scope.imgIndex].content.src_thumb))
        } else {
          $scope.onSwipeRight()
        }
      } else { $scope.imgIndex = $scope.imgPosition }
    }
  }
  $scope.onSwipeLeft = function () {
    if ($scope.imageHandle.getScrollPosition().zoom === $scope.zoomMin) {  // 没有缩放时才允许切换
      $scope.imgIndex++
      if ($scope.imgIndex < $scope.msgs.length) {
        if ($scope.msgs[$scope.imgIndex].contentType === 'image') {
          $scope.imgPosition = $scope.imgIndex
          $scope.imageUrl = (CONFIG.mediaUrl + ($scope.msgs[$scope.imgIndex].content.src || $scope.msgs[$scope.imgIndex].content.src_thumb))
        } else {
          $scope.onSwipeLeft()
        }
      } else { $scope.imgIndex = $scope.imgPosition }
    }
  }

  $scope.updateMsg = function (msg, pos) {
    console.info('updateMsg')
    if (msg.contentType == 'image') msg.content.thumb = CONFIG.mediaUrl + msg.content['src_thumb']
    msg.direct = $scope.msgs[pos].direct

    if (pos == 0) {
      msg.diff = true
    } else if (msg.hasOwnProperty('time')) {
      var m = $scope.msgs[pos - 1]
      if (m.contentType == 'custom' && m.content.type == 'count-notice' && pos > 1) {
        m = $scope.msgs[pos - 2]
      }
      if (m.hasOwnProperty('time')) {
        msg.diff = (msg.time - m.time) > 300000
      } else {
        msg.diff = false
      }
    }
    $scope.msgs[pos] = msg
  }
  $scope.pushMsg = function (msg) {
    console.info('pushMsg')
    var len = $scope.msgs.length
    if (msg.hasOwnProperty('time')) {
      if (len == 0) {
        msg.diff = true
      } else {
        var m = $scope.msgs[len - 1]
        if (m.contentType == 'custom' && m.content.type == 'count-notice' && len > 1) {
          m = $scope.msgs[len - 2]
        }
        if (m.hasOwnProperty('time')) {
          msg.diff = (msg.time - m.time) > 300000
        }
      }
    }
    msg.direct = msg.fromID==$scope.params.UID?'send':'receive';
    $scope.params.msgCount++
    $scope.msgs.push(msg)
    // toBottom(true, 200)
    toBottom(true, 600)
    $timeout(function () {
      var pos = arrTool.indexOf($scope.msgs, 'createTimeInMillis', msg.createTimeInMillis)
      if (pos != -1 && $scope.msgs[pos].status == 'send_going') $scope.msgs[pos].status = 'send_fail'
    }, 10000)
  }
  function insertMsg (msg) {
    var pos = arrTool.indexOf($scope.msgs, 'createTimeInMillis', msg.createTimeInMillis)
    if (pos == -1) {
      $scope.pushMsg(msg)
    } else {
      $scope.updateMsg(msg, pos)
    }
  }
  function msgGen (content, type) {
    var data = {}
    if (type == 'text') {
      data = {
        text: content
      }
    } else if (type == 'image') {
     data = {
        mediaId: content[0],
        mediaId_thumb: content[1],
        src: '',
        src_thumb: ''
      }
    } else if (type == 'voice') {
      data = {
        mediaId: content,
        src: ''
      }
    }
    return {
      clientType: 'wechatpatient',
      contentType: type,
      fromID: $scope.params.UID,
      fromName: thisPatient.name,
      fromUser: {
        avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + $scope.params.UID + '_myAvatar.jpg'
      },
      targetID: $scope.params.chatId,
      targetName: $scope.params.counsel.doctorId.name,
      targetName: $scope.params.targetName,
      targetType: 'single',
      status: 'send_going',
      createTimeInMillis: Date.now(),
      newsType: 11,
      targetRole: 'doctor',
      content: data
    }
  }
  function localMsgGen (msg, url) {
    var d = {},
      type = msg.contentType
    if (type == 'image') {
      d.src = msg.content.src
      d.src_thumb = msg.content.src_thumb
      d.localPath = url
    } else if (type == 'voice') {
      d.localPath = url
      d.src = msg.content.src
    }
    return {
      clientType: 'wechatpatient',
      contentType: type,
      fromID: msg.fromID,
      fromName: msg.fromName,
      fromUser: msg.fromUser,
      targetID: msg.targetID,
      targetName: msg.targetName,
      targetType: 'single',
      status: 'send_going',
      createTimeInMillis: msg.createTimeInMillis,
      newsType: msg.newsType,
      targetRole: 'doctor',
      content: d
    }
  }

  function nomoney () {
    var alertPopup = $ionicPopup.alert({
      title: '本次咨询已结束'
    })
  }
  function sendmsg (content, type) {
    var msgJson = msgGen(content, type)
    socket.emit('message', {msg: msgJson, to: $scope.params.chatId, role: 'patient'})
    $scope.pushMsg(msgJson)
        // toBottom(true);
  }
  $scope.submitMsg = function () {
    console.log('发送消息确认状态 '+$scope.counselstatus)
    if ($scope.counselstatus != 1) return nomoney()
    var template = {
      'userId': $scope.params.chatId, // 医生的UID
      'role': 'doctor',
      'postdata': {
        'template_id': 'DWrM__2UuaLxYf5da6sKOQA_hlmYhlsazsaxYX59DtE',
        'data': {
          'first': {
            'value': '您有一个新的' + ($scope.params.counseltype == 1 ? '咨询' : ($scope.params.counseltype == 6 ? '加急咨询' : '问诊') ) + '消息，请及时处理',
            'color': '#173177'
          },
          'keyword1': {
            'value': $scope.params.counsel.counselId, // 咨询ID
            'color': '#173177'
          },
          'keyword2': {
            'value': $scope.params.counsel.patientId.name, // 患者信息（姓名，性别，年龄）
            'color': '#173177'
          },
          'keyword3': {
            'value': $scope.params.counsel.help, // 问题描述
            'color': '#173177'
          },
          'keyword4': {
            'value': $scope.params.counsel.time.substr(0, 10), // 提交时间
            'color': '#173177'
          },

          'remark': {
            'value': '感谢您的使用！',
            'color': '#173177'
          }
        }
      }
    }
    Mywechat.messageTemplate(template)
    sendmsg($scope.input.text, 'text')
    $scope.input.text = ''
  }
  // 上传图片
  $scope.getImage = function (type) {
    $scope.showMore = false
    var ids = ['', '']
    if (type == 'cam') var st = ['camera']
    else var st = ['album']
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: st, // 可以指定来源是相册还是相机，默认二者都有
      success: function (response) {
        console.log(response)
        ids = ids.concat(response.localIds)
        wx.uploadImage({
          localId: response.localIds[0], // 需要上传的图片的本地ID，由chooseImage接口获得
          isShowProgressTips: 1, // 默认为1，显示进度提示
          success: function (res) {
            console.log(res)
            ids[0] = res.serverId // 返回图片的服务器端ID
            
                        // if(cnt)
            sendmsg(ids, 'image')
                        // else cnt++;
          }
        })
      }
    })
  }
  // 上传语音
  $scope.getVoice = function () {
    if ($scope.counselstatus != 1) return nomoney()
        // voice.record() do 2 things: record --- file manipulation
    $scope.params.recording = true
    voice.record()
        .then(function (fileUrl) {
          $scope.params.recording = false
            // window.JMessage.sendSingleVoiceMessage($state.params.chatId,fileUrl,CONFIG.crossKey,
            // function(res){
            //     console.log(res);
            //     viewUpdate(5,true);
            // },function(err){
            //     console.log(err);
            // });
          viewUpdate(5, true)
        }, function (err) {
          console.log(err)
        })
  }
  $scope.stopAndSend = function () {
    voice.stopRec()
  }

  $scope.chatBack = function () {
    var allowedBackviews = [
      'tab.myConsultRecord',
      'messages'
    ]
    console.log($ionicHistory.backView().stateId)
    if (allowedBackviews.indexOf($ionicHistory.backView().stateId) == -1) {
      $state.go('tab.myDoctors')
    } else {
      $ionicHistory.goBack()
    }
  }
}])

// 健康信息--PXY
.controller('HealthInfoCtrl', ['$ionicActionSheet', '$ionicLoading', '$scope', '$timeout', '$state', '$ionicHistory', '$ionicPopup', 'Storage', 'Health', 'Dict','$ionicPopover', 'CONFIG','$ionicModal','$ionicScrollDelegate',function ($ionicActionSheet, $ionicLoading, $scope, $timeout, $state, $ionicHistory, $ionicPopup, Storage, Health, Dict,$ionicPopover,CONFIG,$ionicModal,$ionicScrollDelegate) {
  var patientId = Storage.get('UID')

  $scope.Goback = function () {
    $ionicHistory.goBack()
  }
  //---------点击显示大图------------
  //图片模块初始化
    function imgModalInit () {
    $scope.zoomMin = 1
    $scope.imageUrl = ''
    // $scope.imageIndex = -1 //当前展示的图片
    $scope.Images = []
    $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
        // $scope.modal.show();
        $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
    }); 
  }
  $scope.showbigger = function (path) {
    $scope.imageIndex = urlArray.indexOf(path)
    // console.log($scope.imageIndex)
    var hasResized = path.indexOf('resized')>-1 ? 7:0
    var originalfilepath = CONFIG.imgLargeUrl + path.slice(path.lastIndexOf('/') + 1).substr(hasResized)
    $scope.imageHandle.zoomTo(1, true)
    $scope.imageUrl = originalfilepath
    $scope.modal.show()
  }
  $scope.closeModal = function () {
    $scope.imageHandle.zoomTo(1, true)
    $scope.modal.hide()
      // $scope.modal.remove()
  }
  $scope.switchZoomLevel = function () {
    if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin) { $scope.imageHandle.zoomTo(1, true) } else {
      $scope.imageHandle.zoomTo(5, true)
    }
  }
    //右划图片
  $scope.onSwipeRight = function () {
    if ($scope.imageIndex <= $scope.Images.length - 1 && $scope.imageIndex > 0)
      $scope.imageIndex = $scope.imageIndex - 1;
    else {
      //如果图片已经是第一张图片了，则取index = Images.length-1
      $scope.imageIndex = $scope.Images.length - 1;
    }
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }
  //左划图片
  $scope.onSwipeLeft = function () {
    if ($scope.imageIndex < $scope.Images.length - 1 && $scope.imageIndex >= 0)
      $scope.imageIndex = $scope.imageIndex + 1;
    else {
      //如果图片已经是最后一张图片了，则取index = 0
      $scope.imageIndex = 0;
    }
    //替换url，展示图片
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }  
    $scope.$on('$ionicView.leave', function () {
    $scope.modal.remove()
  })
  var urlArray = new Array()  
  var RefreshHealthRecords = function (code) {

    $scope.noHealth = false
    $scope.items = new Array()
    Health.getAllHealths({userId: patientId,type:code}).then(
        function (data) {
          // console.log(data.results)
          if (data.results != '' && data.results != null) {
            $scope.items = data.results
            for (i = 0; i < $scope.items.length;i++){
              if ($scope.items[i].url != "" && $scope.items[i].url!=null) {
                urlArray = urlArray.concat($scope.items[i].url)
              }
            }
            for (i = 0; i < urlArray.length; i++) {
              var hasResized = urlArray[i].indexOf('resized')>-1 ? 7:0
              console.log(urlArray[i].slice(urlArray[i].lastIndexOf('/')+1).substr(hasResized))
              $scope.Images[i] = CONFIG.imgLargeUrl+urlArray[i].slice(urlArray[i].lastIndexOf('/')+1).substr(hasResized)
            } 
          } else {
            $scope.noHealth = true
          }
        },
        function (err) {
          console.log(err)
        }
      )
  }

  $scope.$on('$ionicView.enter', function () {
    // $scope.labels = {}
    Dict.getHeathLabelInfo({category: 'healthInfoType'}).then(
      function (data) {
        $scope.types = data.results.details
        // $scope.label = $scope.labels[$scope.labels.length-1]
      },
      function(err){
      })
    imgModalInit ()
    RefreshHealthRecords()
  })

  $scope.do_refresher = function (code) {
    console.log(code)
    imgModalInit ()
    RefreshHealthRecords(code)
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.gotoHealthDetail = function (ele, editId,type) {
    // console.log(ele)
    // console.log(ele.target)
    if (ele.target.nodeName == 'I') {
      var confirmPopup = $ionicPopup.confirm({
        title: '删除提示',
        template: '记录删除后将无法恢复，确认删除？',
        cancelText: '取消',
        okText: '删除'
      })

      confirmPopup.then(function (res) {
        if (res) {
          Health.deleteHealth({userId: patientId, insertTime: editId.insertTime}).then(
              function (data) {
                RefreshHealthRecords(type)
                  // for (var i = 0; i < $scope.items.length; i++) {
                  //   if (editId.insertTime == $scope.items[i].insertTime) {
                  //     $scope.items.splice(i, 1)
                  //     break
                  //   }
                  // }

                // console.log($scope.items)
              },
              function (err) {
                console.log(err)
              }
            )
            // 20140421 zxf
          var healthinfotimes = angular.fromJson(Storage.get('consulthealthinfo')) ? angular.fromJson(Storage.get('consulthealthinfo')) : []
          for (var i = 0; i < healthinfotimes.length; i++) {
            if (healthinfotimes[i].time == editId.insertTime) {

              healthinfotimes.splice(i, 1)
              break
            }
          }
          Storage.set('consulthealthinfo', angular.toJson(healthinfotimes))
            // HealthInfo.remove(number);
            // $scope.items = HealthInfo.getall();
        }
      })
    } else {
      $state.go('tab.myHealthInfoDetail', {id: editId, caneidt: false})
    }
  }


  $ionicPopover.fromTemplateUrl('partials/pop/newHealthPopover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.addHealth = function ($event) {
   $scope.newHealth() 
   //  $ionicActionSheet.show({
   //   buttons: [
   //     { text: '尿液试纸上传' },
   //     { text: '其他健康信息' }
   //   ],
   //   cancelOnStateChange: true,
   //   titleText: '上传',
   //   buttonClicked: function(index) {
   //    if(index===0){
   //      $scope.urineUpload()
   //    }else{
   //      $scope.newHealth()
   //    }
   //     // return true;
   //   }
   // })
   //  // $scope.openPopover($event)
  }
  // 选择个人信息的点击事件----------------------------
  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };
  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
  // Execute action on hide popover
  $scope.$on('popover.hidden', function() {
    // Execute action
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
  });

  $scope.newHealth = function () {
    // $scope.closePopover()
    $state.go('tab.myHealthInfoDetail', {id: null, caneidt: true})
  }

  // $scope.urineUpload = function(){
  //   $scope.closePopover()
  //   $state.go('tab.urineDoctor')

  // }

}])

// .controller('urineDoctorCtrl', ['$scope', '$state', 'Storage','Devicedata', '$sce', 'CONFIG', function ( $scope, $state, Storage,Devicedata,$sce,CONFIG) {
//   var client = ionic.Platform.isIOS() ? 'iOS' : 'Android'
//   Devicedata.urineConnect({client:client,userbind:Storage.get('UID')}).then(function(data){
//     var urineUrl = CONFIG.NiaodaifuUrl + "?appkey=" + data.results.appkey + "&sign=" + data.results.sign + "&atime=" + data.results.atime + "&userbind=" + Storage.get('UID') + "&mode=1"
//     $scope.navigation = $sce.trustAsResourceUrl(urineUrl)
//     // alert(JSON.stringify(data))
//   },function(err){
//     // alert(JSON.stringify(err))
//   })

// }])

// 健康详情--PXY
.controller('HealthDetailCtrl', ['otherTask', '$scope', '$state', '$ionicHistory', '$ionicPopup', '$stateParams', '$ionicPopover', '$ionicModal', '$ionicScrollDelegate', '$ionicLoading', '$timeout', 'Dict', 'Health', 'Storage', 'Camera', 'CONFIG', 'Mywechat', '$location', function (otherTask, $scope, $state, $ionicHistory, $ionicPopup, $stateParams, $ionicPopover, $ionicModal, $ionicScrollDelegate, $ionicLoading, $timeout, Dict, Health, Storage, Camera, CONFIG, Mywechat, $location) {
  var patientId = Storage.get('UID')
  // $scope.healthDetailStyle = {'top': '43px'}
  // if (ionic.Platform.isIOS()) {
  //   $scope.healthDetailStyle = {'top': '63px'}
  // }

  // $scope.$watch('canEdit', function (oldval, newval) {
  //   console.log('oldval:' + oldval)
  //   console.log('newval:' + newval)
  // })
  $scope.canEdit = $stateParams.caneidt
  console.log($stateParams.caneidt)


  $scope.Goback = function () {
        // if($scope.canEdit==true){
        //     $scope.canEdit = false;
        // }else{
    if ($ionicHistory.backTitle() == null) {
      $state.go('tab.myHealthInfo')
    } else {
      $ionicHistory.goBack()
    }
    // console.log(123)
    // console.log($ionicHistory.backTitle())

        // }
  }

  // 点击显示大图
  $scope.zoomMin = 1
  $scope.imageUrl = ''
  // $scope.imageIndex = -1
  $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal
      // $scope.modal.show();
    $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle')
  })

  // $scope.healthinfoimgurl = '';
  // $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/healthinfoimag.html', {
  //     scope: $scope,
  //     animation: 'slide-in-up'
  //   }).then(function(modal) {
  //     $scope.modal = modal;
  //   });

  $scope.edit = function () {
    $scope.canEdit = true
  }

  // $scope.$on('$ionicView.enter', function() {

  // })

    // 从字典中搜索选中的对象。
  var searchObj = function (code, array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].name == code) return array[i]
    };
    return '未填写'
  }

  // 获取标签类别
  $scope.labels = {} // 初始化
  $scope.health = {
    label: null,
    date: null,
    text: null,
    imgurl: null
  }
  $scope.health.imgurl = []
  $scope.Images = []
  Dict.getHeathLabelInfo({category: 'healthInfoType'}).then(
        function (data) {
          $scope.labels = data.results.details
            // 判断是修改还是新增
          if ($stateParams.id != null && $stateParams != '') {
                // 修改
                // $scope.canEdit = false;
            var info = $stateParams.id
            console.log(info)
            Health.getHealthDetail({userId: patientId, insertTime: info.insertTime}).then(function (data) {
              if (data.results != '' && data.results != null) {
                $scope.health.label = data.results.label
                // console.log(data.results.label)
                if ($scope.health.label != null && $scope.health.label != '') {
                  $scope.health.label = searchObj($scope.health.label, $scope.labels)
                  // console.log($scope.health.label)
                }
                $scope.health.date = data.results.time
                $scope.health.text = data.results.description
                if (data.results.url != '' && data.results.url != null) {
                  // console.log(data.results.url)
                  $scope.health.imgurl = data.results.url
                        // $scope.showflag=true;
                    for (i = 0; i < data.results.url.length; i++) {
                    var resized = data.results.url[i].indexOf('resized')>-1 ? 7 : 0
                    $scope.Images[i] = CONFIG.imgLargeUrl+data.results.url[i].slice(data.results.url[i].lastIndexOf('/')+1).substr(resized)
                   } 
                }
              }
              console.log($scope.health)
            },
            function (err) {
              console.log(err)
            })

          }
          if ($ionicHistory.backView()) {
            if ($ionicHistory.backView().stateName == 'tab.tasklist') {
              var task = angular.fromJson(Storage.get('task'))
              if (task.type == 'LabTest') {
                $scope.health.label = searchObj('化验', $scope.labels)
                $scope.labTest = true
              }
            }
          }

          console.log($scope.labels)
        },
        function (err) {
          console.log(err)
        })
  // angular.toJson fromJson()
  // 2017419 zxf
  // var testtt=[];
  // testtt.push("http://121.43.107.106:8052/uploads/photos/")
  // testtt.push("http://121.43.107.10da6:8052/uploads/photos/")
  // Storage.set('test',angular.toJson(testtt))
  // console.log(testtt)
  // console.log(Storage.get('test'))
  // console.log(angular.fromJson(Storage.get('test')))
  // testtt=angular.fromJson(Storage.get('test'))

// Storage.set('localhealthinfoimg',angular.toJson(testtt))
// 进入之后local有数据但是不显示
  // $scope.health.imgurl=[];
  // var tmpimgurl=Storage.get('localhealthinfoimg');
  // console.log(tmpimgurl)
  // if(tmpimgurl!=""&&tmpimgurl!=null){
  //   console.log(tmpimgurl)
  //   $scope.health.imgurl=angular.fromJson(tmpimgurl);
  //   console.log($scope.health.imgurl)
  //   $scope.showflag=true;
  // }

  $scope.HealthInfoSetup = function () {
    // console.log($scope.health.text);
    if (($scope.health.label && $scope.health.date) && ($scope.health.text || $scope.health.imgurl.length)) {
      console.log($stateParams.id)
      $ionicLoading.show({
        template: '上传中...',
        hideOnStateChange: true}

        )
      if ($stateParams.id == null || $stateParams == '') {
        Health.createHealth({userId: patientId, type: $scope.health.label.code, time: $scope.health.date, url: $scope.health.imgurl, label: $scope.health.label.name, description: $scope.health.text, comments: ''}).then(
              function (data) {
                // console.log(data.results);
                // console.log(data.results.insertTime);
                // $scope.canEdit= false;
                $ionicLoading.hide()
                var healthinfoToconsult = []
                // 从咨询过来的需要返回对应的健康信息
                if ($ionicHistory.backView() != null) {
                  if ($ionicHistory.backView().stateName == 'tab.consultQuestionnaire') {

                    if (Storage.get('consulthealthinfo') == '' || Storage.get('consulthealthinfo') == null || Storage.get('consulthealthinfo') == 'undefined') {
                      healthinfoToconsult.push({'time': data.results.insertTime})
                    } else {
                      healthinfoToconsult = angular.fromJson(Storage.get('consulthealthinfo'))
                      healthinfoToconsult.push({'time': data.results.insertTime})
                    }
                    Storage.set('consulthealthinfo', angular.toJson(healthinfoToconsult))
                    console.log(Storage.get('consulthealthinfo'))
                  } else if ($ionicHistory.backView().stateName == 'tab.tasklist') {
                    var task = angular.fromJson(Storage.get('task'))
                    var otherTasks = angular.fromJson(Storage.get('otherTasks'))
                    otherTask.Postcompliance_UpdateTaskStatus(task, otherTasks, data.results.insertTime)
                  }

                }

                $ionicHistory.goBack()
              },
              function (err) {
                $ionicLoading.hide()
                $ionicPopup.alert({
                   title: '网络跑远啦',
                   template: '请重新上传'
                 })
                console.log(err)
              }
            )
      } else {
        var curdate = new Date()
        Health.modifyHealth({userId: patientId, type: $scope.health.label.code, time: $scope.health.date, url: $scope.health.imgurl, label: $scope.health.label.name, description: $scope.health.text, comments: '', insertTime: $stateParams.id.insertTime}).then(
              function (data) {
                console.log(data.data)
                // $scope.canEdit= false;
                $ionicHistory.goBack()
              },
              function (err) {
                console.log(err)
              }
            )
      }
    } else {
      $ionicLoading.show({
        template: '请用文字描述或者上传图片！',
        duration: 1000
      })
    }
  }


  // --------datepicker设置----------------
  var monthList = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  var weekDaysList = ['日', '一', '二', '三', '四', '五', '六']
  var datePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject4.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.health.date = yyyy + '-' + m + '-' + d
    }
  }
  $scope.datepickerObject4 = {
    titleLabel: '时间日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    mondayFirst: false,    // Optional
    // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      datePickerCallback(val)
    }
  }
// --------------copy from minectrl
  // 上传头像的点击事件----------------------------
  $scope.onClickCamera = function ($event) {
    $scope.openPopover($event)
  }

 // 上传照片并将照片读入页面-------------------------
  // var photo_upload_display = function (imgURI) {
  //  // 给照片的名字加上时间戳
  //   var temp_photoaddress = Storage.get('UID') + '_' + new Date().getTime() + 'healthinfo.jpg'
  //   console.log(temp_photoaddress)
  //   Camera.uploadPicture(imgURI, temp_photoaddress)
  //   .then(function (res) {
  //     var data = angular.fromJson(res)
  //     // 图片路径
  //     $scope.health.imgurl.push(CONFIG.mediaUrl + String(data.path_resized))
  //     // $state.reload("tab.mine")
  //     // Storage.set('localhealthinfoimg',angular.toJson($scope.health.imgurl));
  //     console.log($scope.health.imgurl)
  //     // $scope.showflag=true;
  //   }, function (err) {
  //     console.log(err)
  //     reject(err)
  //   })
  // }
  var photo_upload_display = function(serverId){
    // $ionicLoading.show({
    //     template:'头像更新中',
    //     duration:5000
    // })
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("UID") + "_" +  "myAvatar.jpg";
    console.log(temp_photoaddress)
    var temp_name = 'resized' + Storage.get("UID") + "_" +  "myAvatar.jpg";
    Mywechat.download({serverId:serverId, name:temp_name})
    .then(function(res){
      //res.path_resized
      $timeout(function(){
          // $ionicLoading.hide();
          //图片路径
          $scope.myAvatar=CONFIG.mediaUrl + "uploads/photos/"+temp_name+'?'+new Date().getTime();
          console.log($scope.myAvatar)
          // $state.reload("tab.mine")
          $scope.health.imgurl.push($scope.myAvatar)
    //       Patient.editPatientDetail({userId:Storage.get("UID"),photoUrl:$scope.myAvatar}).then(function(r){
    //         console.log(r);
    //       })
      },1000)
      
    },function(err){
      console.log(err);
      reject(err);
        })
      
  }
// -----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        // --------------------------------------------
        // .fromTemplateUrl() method
  $ionicPopover.fromTemplateUrl('partials/pop/cameraPopover.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (popover) {
    $scope.popover = popover
  })
  $scope.openPopover = function ($event) {
    $scope.popover.show($event)
  }
  $scope.closePopover = function () {
    $scope.popover.hide()
  }
  // Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function () {
    $scope.popover.remove()
  })
  // Execute action on hide popover
  $scope.$on('popover.hidden', function () {
    // Execute action
  })
  // Execute action on remove popover
  $scope.$on('popover.removed', function () {
    // Execute action
  })

  // 相册键的点击事件---------------------------------
  $scope.onClickCameraPhotos = function () {
   // console.log("选个照片");
    $scope.choosePhotos()
    $scope.closePopover()
  }
  // $scope.choosePhotos = function () {
  //   Camera.getPictureFromPhotos('gallery', true).then(function (data) {
  //     // data里存的是图像的地址
  //     // console.log(data);
  //     var imgURI = data
  //     photo_upload_display(imgURI)
  //   }, function (err) {
  //     // console.err(err);
  //     var imgURI
  //   })// 从相册获取照片结束
  // } // function结束
  $scope.choosePhotos = function() {
    var config = "";
    var path = $location.absUrl().split('#')[0]
    Mywechat.settingConfig({url:path}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['chooseImage','uploadImage']
      // alert(config.jsApiList)
      // alert(config.debug)
      console.log(angular.toJson(config))
      wx.config({
        debug:false,
        appId:config.appId,
        timestamp:config.timestamp,
        nonceStr:config.nonceStr,
        signature:config.signature,
        jsApiList:config.jsApiList
      })
      wx.ready(function(){
        wx.checkJsApi({
            jsApiList: ['chooseImage','uploadImage'],
            success: function(res) {
                wx.chooseImage({
                  count:1,
                  sizeType: ['original','compressed'],
                  sourceType: ['album'],
                  success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                  }
                })
            }
        });
      })
      wx.error(function(res){
        alert(res.errMsg)
      })

    },function(err){

    })
  }; // function结束

  // 照相机的点击事件----------------------------------
  $scope.getPhoto = function () {
    // console.log("要拍照了！");
    $scope.takePicture()
    $scope.closePopover()
  }
  $scope.isShow = true
  // $scope.takePicture = function () {
  //   Camera.getPicture('cam', true).then(function (data) {
  //     var imgURI = data
  //     photo_upload_display(imgURI)
  //   }, function (err) {
  //       // console.err(err);
  //     var imgURI
  //   })// 照相结束
  // } // function结束
  $scope.takePicture = function() {
      var config = "";
      var path = $location.absUrl().split('#')[0]
      Mywechat.settingConfig({url:path}).then(function(data){
        // alert(data.results.timestamp)
        config = data.results;
        config.jsApiList = ['chooseImage','uploadImage']
        // alert(config.jsApiList)
        // alert(config.debug)
        console.log(angular.toJson(config))
        wx.config({
          debug:false,
          appId:config.appId,
          timestamp:config.timestamp,
          nonceStr:config.nonceStr,
          signature:config.signature,
          jsApiList:config.jsApiList
        })
        wx.ready(function(){
          wx.checkJsApi({
          jsApiList: ['chooseImage','uploadImage'],
          success: function(res) {
              wx.chooseImage({
                count:1,
                sizeType: ['original','compressed'],
                sourceType: ['camera'],
                success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                }
              })
          }
          });
        })
      wx.error(function(res){
        alert(res.errMsg)
      })

      },function(err){

      })
    }; // function结束

    // $scope.openModal = function() {
    //   $scope.modal.show();
    // };
    // $scope.closeModal = function() {
    //   $scope.modal.hide();
    // };
    // //Cleanup the modal when we're done with it!
    // $scope.$on('$destroy', function() {
    //   $scope.modal.remove();
    // });
    // // Execute action on hide modal
    // $scope.$on('modal.hidden', function() {
    //   // Execute action
    // });
    // // Execute action on remove modal
    // $scope.$on('modal.removed', function() {
    //   // Execute action
    // });

  // //点击图片返回
  // $scope.imggoback = function(){
  //   $scope.modal.hide();
  // };
  $scope.showoriginal = function (resizedpath) {
    // $scope.openModal();
    // console.log(resizedpath)
     var resized = resizedpath.indexOf('resized')>-1? 7 :0
    var originalfilepath = CONFIG.imgLargeUrl + resizedpath.slice(resizedpath.lastIndexOf('/') + 1).substr(resized)
    // console.log(originalfilepath)
    // $scope.doctorimgurl=originalfilepath;
    $scope.imageHandle.zoomTo(1, true)
    $scope.imageUrl = originalfilepath
    $scope.imageIndex = $scope.Images.indexOf($scope.imageUrl)
    $scope.modal.show()
  }
  $scope.closeModal = function () {
    $scope.imageHandle.zoomTo(1, true)
    $scope.modal.hide()
      // $scope.modal.remove()
  }
  $scope.switchZoomLevel = function () {
    if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin) { $scope.imageHandle.zoomTo(1, true) } else {
      $scope.imageHandle.zoomTo(5, true)
    }
  }

  $scope.deleteimg = function (index) {
    // somearray.removeByValue("tue");
    console.log($scope.health.imgurl)
    $scope.health.imgurl.splice(index, 1)
    // Storage.set('tempimgrul',angular.toJson($scope.images));
  }
    //右划图片
  $scope.onSwipeRight = function () {
    if ($scope.imageIndex <= $scope.Images.length - 1 && $scope.imageIndex > 0)
      $scope.imageIndex = $scope.imageIndex - 1;
    else {
      //如果图片已经是第一张图片了，则取index = Images.length-1
      $scope.imageIndex = $scope.Images.length - 1;
    }
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }
  //左划图片
  $scope.onSwipeLeft = function () {
    if ($scope.imageIndex < $scope.Images.length - 1 && $scope.imageIndex >= 0)
      $scope.imageIndex = $scope.imageIndex + 1;
    else {
      //如果图片已经是最后一张图片了，则取index = 0
      $scope.imageIndex = 0;
    }
    //替换url，展示图片
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }  
  $scope.$on('$ionicView.leave', function () {
    $scope.modal.remove()
  })
}])

// 增值服务--PXY
.controller('MoneyCtrl', ['$scope', '$state', '$ionicHistory', 'Account', 'Storage', 'Patient', function ($scope, $state, $ionicHistory, Account, Storage, Patient) {
  var PID = Storage.get('UID')
  var docid = ''
  $scope.Goback = function () {
    $state.go('tab.mine')
  }
  // $scope.TimesRemain ="0";
  $scope.TimesRemainZX = '0'
  $scope.TimesRemainWZ = '0'
  $scope.freeTimesRemain = '0'
  // 20170504 zxf
  var LoadMyAccount = function () {
    Account.getCounts({patientId: Storage.get('UID')}).then(
    function (data) {
      console.log(data)
      $scope.freeTimesRemain = data.result.freeTimes
      // $scope.TimesRemain=data.result.totalCount;
    },
    function (err) {
      console.log(err)
    }
  )
  }
  // 0515 zxf
  Account.getCountsRespective({patientId: Storage.get('UID')}).then(function (data) {
    console.log(data)
    $scope.TimesRemainZX = data.result.count1
    $scope.TimesRemainWZ = data.result.count2
  }, function (err) {
    console.log(err)
  })

  $scope.$on('$ionicView.enter', function () {
    LoadMyAccount()
  })

  $scope.do_refresher = function () {
    LoadMyAccount()
    $scope.$broadcast('scroll.refreshComplete')
  }
}])

// 测量记录
.controller('ReportsCtrl', ['$scope', 'Measurement','Storage','$ionicHistory', '$ionicLoading', '$ionicPopup', '$state', '$http', function($scope, Measurement, Storage, $ionicHistory, $ionicLoading, $ionicPopup, $state, $http){
   //加载动作
  $scope.$on('$ionicView.beforeEnter', function () {
    $ionicLoading.show({  
            template: '<ion-spinner icon="bubbles" class="spinner-calm"></ion-spinner>',   
            duration: 5000
        });  
  })
  var switchLoading = function(){
    $ionicLoading.show({  
            template: '<ion-spinner icon="bubbles" class="spinner-calm"></ion-spinner>',   
            duration: 5000
        })
  }

  $scope.Goback = function () {
    $ionicHistory.goBack() 
    }
  $scope.Refresh = function () {
    $http.get('/#/tab/mine/Reports/').success(function() {
      console.log("refresh")
     })
     .finally(function() {
       $scope.$broadcast('scroll.refreshComplete');
     });
  }
  var Painting = function(date,modify,timeType){
        $scope.flagBP = true
        $scope.flagT = true
        $scope.flagPD = true
        $scope.flagWeight = true
        $scope.flagHR = true
        $scope.flagVol = true
        //体温
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
              console.log("no data at all")
              var chart = new Highcharts.Chart('container1', {
               credits:{enabled:false},
               chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '不存在该段时间的报告！',
                 x: 0,
                 y: 20,
                      }})
               }else 
                  if(vitalsign.item.data1.length==0){
                    $scope.flagT = vitalsign.flag.flagT
                    console.log("blank array")
                    var chart = new Highcharts.Chart('container1', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影 
                        }, 
                    title: {
                    text: '您没有体温的测量数据！',
                    x: 0,
                    y: 20,
                      }})
                  }
                        else{
                        $scope.flagT = vitalsign.flag.flagT
                        ChartData = vitalsign.item.data1
                        ChartTime = vitalsign.item.recordTime
                            for(i=0; i<ChartTime.length; i++){
                              ChartTime[i]=ChartTime[i].substring(0,10)
                                 }
                              var chart = new Highcharts.Chart('container1', {
                              credits:{enabled:false},
                              chart: {
                              borderRadius:5,//图表边框圆角角度  
                              shadow:true,//是否设置阴影  
                              // zoomType:'x',                            
                            }, 
                            colors:[       
                              '#FF8040',
                              '#66B3FF',
                              '#0080FF',
                            ],  
                            title: {
                              text: '体温',
                              x: 0,
                              y: 33,
                            },
                            xAxis: {
                              categories: ChartTime
                              },
                            yAxis: {
                              title: {
                              text: '温度(°C)',
                                    x:0,
                                    y:-10
                                  },
                            plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                              }]
                            },
                            tooltip: {
                            valueSuffix: '°C'
                                 },
                            legend: {
                            layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                            align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                            verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                            borderWidth: 0,
                            x:0,
                            y:+50
                             },
                            series: [{
                            name: '体温℃',
                            data: ChartData
                   }]
                })
            } },function(err){
        })
        //体重
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Weight", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
              var chart = new Highcharts.Chart('container2', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
               }else if(vitalsign.item.data1.length==0){
                $scope.flagWeight = vitalsign.flag.flagWeight
                 var chart = new Highcharts.Chart('container2', {
               credits:{enabled:false},
               chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '您没有体重的测量数据！',
                 x: 0,
                 y: 20,
                  }})}
                     else{                      
                    $scope.flagWeight = vitalsign.flag.flagWeight
                    ChartData = vitalsign.item.data1
                    ChartTime = vitalsign.item.recordTime
                        for(i=0; i<ChartTime.length; i++){
                             ChartTime[i]=ChartTime[i].substring(0,10)
                               }
                       var chart = new Highcharts.Chart('container2', {
                        credits:{enabled:false},
                    chart: {
                          borderRadius:5,//图表边框圆角角度  
                          shadow:true,//是否设置阴影  
                          // zoomType:'x',
                         }, 
                    colors:[       
                           '#FF8040',
                           '#66B3FF',
                          '#0080FF',
                            ],  
                   title: {
                       text: '体重',
                       x: 0,
                       y: 33,
                     },
                    xAxis: {
                        categories: ChartTime
                        },
                     yAxis: {
                         title: {
                       text: '体重(Kg)',
                               x:0,
                            y:-10
                      },
                    plotLines: [{
                    //控制x轴线型
                    value: 0,
                    width: 0.1,
                    color: '#808080'
                    }]
                   },
                    tooltip: {
                    valueSuffix: 'Kg'
                  },
                    legend: {
                      layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                      align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                      verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                      borderWidth: 0,
                      x:0,
                      y:+50
                  },
                    series: [{
                    name: '体重Kg',
                    data: ChartData
               }]
             })
            } },function(err){
        })
       //血压
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "BloodPressure", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartData2 = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
              var chart = new Highcharts.Chart('container3', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
               }else if(vitalsign.item.data1.length==0){
                $scope.flagBP = vitalsign.flag.flagBP
                 var chart = new Highcharts.Chart('container3', {
               credits:{enabled:false},
               chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '您没有血压的测量数据！',
                 x: 0,
                 y: 20,
                  }})}
                     else{
                    $scope.flagBP = vitalsign.flag.flagBP
                    ChartData = vitalsign.item.data1
                    ChartData2 = vitalsign.item.data2
                    ChartTime = vitalsign.item.recordTime
                        for(i=0; i<ChartTime.length; i++){
                             ChartTime[i]=ChartTime[i].substring(0,10)
                               }
                       var chart = new Highcharts.Chart('container3', {
                        credits:{enabled:false},
                    chart: {
                          borderRadius:5,//图表边框圆角角度  
                          shadow:true,//是否设置阴影  
                          // zoomType:'x',                         
                         }, 
                    colors:[       
                           '#FF8040',
                           '#66B3FF',
                           '#0080FF',
                            ],  
                   title: {
                       text: '血压',
                       x: 0,
                       y: 33,
                     },
                    xAxis: {
                        categories: ChartTime
                        },
                     yAxis: {
                         title: {
                       text: '血压(mmHg)',
                               x:0,
                            y:-10
                      },
                    plotLines: [{
                    //控制x轴线型
                    value: 0,
                    width: 0.1,
                    color: '#808080'
                    }]
                   },
                    tooltip: {
                    valueSuffix: 'mmHg'
                  },
                    legend: {
                      layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                      align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                      verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                      borderWidth: 0,
                      x:0,
                      y:+50
                  },
                    series: [{
                      name: '高压mmHg',
                      data: ChartData
                    },{
                      name: '低压mmHg',
                      data: ChartData2
                    }
                  ]
             })
            } },function(err){
        })
        //尿量
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Vol", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
              var chart = new Highcharts.Chart('container4', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
               }else if(vitalsign.item.data1.length==0){
                 $scope.flagVol = vitalsign.flag.flagVol
                 var chart = new Highcharts.Chart('container4', {
               credits:{enabled:false},
               chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '您没有尿量的测量数据！',
                 x: 0,
                 y: 20,
                  }})}
                     else{
                   $scope.flagVol = vitalsign.flag.flagVol
                    ChartData = vitalsign.item.data1
                    ChartTime = vitalsign.item.recordTime
                        for(i=0; i<ChartTime.length; i++){
                             ChartTime[i]=ChartTime[i].substring(0,10)
                               }
                       var chart = new Highcharts.Chart('container4', {
                        credits:{enabled:false},
                    chart: {
                          borderRadius:5,//图表边框圆角角度  
                          shadow:true,//是否设置阴影  
                          // zoomType:'x',
                         }, 
                    colors:[       
                           '#FF8040',
                           '#66B3FF',
                          '#0080FF',
                            ],  
                   title: {
                       text: '尿量',
                       x: 0,
                       y: 33,
                     },
                    xAxis: {
                        categories: ChartTime
                        },
                     yAxis: {
                         title: {
                       text: '尿量mL',
                               x:0,
                            y:-10
                      },
                    plotLines: [{
                    //控制x轴线型
                    value: 0,
                    width: 0.1,
                    color: '#808080'
                    }]
                   },
                    tooltip: {
                    valueSuffix: 'mL'
                  },
                    legend: {
                      layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                      align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                      verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                      borderWidth: 0,
                      x:0,
                      y:+50
                  },
                    series: [{
                    name: '尿量mL',
                    data: ChartData
               }]
             })
            } },function(err){
        })
        //心率
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "HeartRate", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
             var chart = new Highcharts.Chart('container5', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
               }else if(vitalsign.item.data1.length==0){
                $scope.flagHR = vitalsign.flag.flagHR
                 var chart = new Highcharts.Chart('container5', {
                 credits:{enabled:false},
                 chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '您没有心率的测量数据！',
                 x: 0,
                 y: 20,
                  }})}
                     else{
                    $scope.flagHR = vitalsign.flag.flagHR
                    ChartData = vitalsign.item.data1
                    ChartTime = vitalsign.item.recordTime
                        for(i=0; i<ChartTime.length; i++){
                             ChartTime[i]=ChartTime[i].substring(0,10)
                               }
                       var chart = new Highcharts.Chart('container5', {
                        credits:{enabled:false},
                    chart: {
                          borderRadius:5,//图表边框圆角角度  
                          shadow:true,//是否设置阴影  
                          // zoomType:'x',
                         }, 
                    colors:[       
                           '#FF8040',
                           '#66B3FF',
                          '#0080FF',
                            ],  
                   title: {
                       text: '心率',
                       x: 0,
                       y: 33,
                     },
                    xAxis: {
                        categories: ChartTime
                        },
                     yAxis: {
                         title: {
                       text: '心率（次）',
                               x:0,
                            y:-10
                      },
                    plotLines: [{
                    //控制x轴线型
                    value: 0,
                    width: 0.1,
                    color: '#808080'
                    }]
                   },
                    tooltip: {
                    valueSuffix: '次'
                  },
                    legend: {
                      layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                      align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                      verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                      borderWidth: 0,
                      x:0,
                      y:+50
                  },
                    series: [{
                    name: '心率（次）',
                    data: ChartData
               }]
             })
            } },function(err){
        })
        //腹透
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "PeritonealDialysis", showType: timeType, modify:modify}).then(
         function(data){
          var ChartData = new Array()
          var ChartTime = new Array()
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
             var chart = new Highcharts.Chart('container6', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
               }else if(vitalsign.item.data1.length==0){
                $scope.flagPD = vitalsign.flag.flagPD
                console.log($scope.flagPD)
                 var chart = new Highcharts.Chart('container6', {
                 credits:{enabled:false},
                 chart: {
                    height:50,
                    borderRadius:5,//图表边框圆角角度  
                    shadow:true,//是否设置阴影  
                   }, 
                title: {
                text: '您没有腹透的测量数据！',
                 x: 0,
                 y: 20,
                  }})}
                     else{
                    $scope.flagPD = vitalsign.flag.flagPD
                    ChartData1 = vitalsign.item.data1
                    ChartData2 = vitalsign.item.data2
                    ChartTime = vitalsign.item.recordTime
                        for(i=0; i<ChartTime.length; i++){
                             ChartTime[i]=ChartTime[i].substring(0,10)
                               }
                       var chart = new Highcharts.Chart('container6', {
                        credits:{enabled:false},
                    chart: {
                          borderRadius:5,//图表边框圆角角度  
                          shadow:true,//是否设置阴影  
                          // zoomType:'x',
                         }, 
                    colors:[       
                           '#FF8040',
                           '#66B3FF',
                          '#0080FF',
                            ],  
                   title: {
                       text: '腹透',
                       x: 0,
                       y: 33,
                     },
                    xAxis: {
                        categories: ChartTime
                        },
                     yAxis: {
                         title: {
                       text: '腹透（mL）',
                               x:0,
                               y:-10
                            },
                    plotLines: [{
                    //控制x轴线型
                    value: 0,
                    width: 0.1,
                    color: '#808080'
                    }]
                   },
                    tooltip: {
                    valueSuffix: 'mL'
                  },
                    legend: {
                      layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                      align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                      verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                      borderWidth: 0,
                      x:0,
                      y:+50
                  },
                    series: [{
                    name: '超滤量mL',
                    data: ChartData1
                },{
                    name: '出量mL',
                    data: ChartData2
                }]
             })
            } },function(err){
        })
        //化验
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "LabTest", showType: timeType, modify: modify}).then(
          function(data){
            var vitalsign = new Array()
            var ChartData1 = new Array()
            var ChartData2 = new Array()
            var ChartData3 = new Array()
            var ChartData4 = new Array()
            var ChartData5 = new Array()
            var ChartTime1 = new Array()
            var ChartTime2 = new Array()
            var ChartTime3 = new Array()
            var ChartTime4 = new Array()
            var ChartTime5 = new Array()
            vitalsign = data
            if (data.results == "不存在该段时间的报告!"){
                var chart1 = new Highcharts.Chart('container7', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
                var chart2 = new Highcharts.Chart('container8', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
                var chart3 = new Highcharts.Chart('container9', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
                var chart4 = new Highcharts.Chart('container10', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
                var chart5 = new Highcharts.Chart('container11', {
               credits:{enabled:false},
               chart: {                  
                   }, 
                title: {
                text: ''
                  }})
                return
            }
            else if(vitalsign.results.item.recordTime.length==0){
                var chart = new Highcharts.Chart('container7', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                    }, 
                    title: {
                        text: '您没有肌酐的测量数据！',
                        x: 0,
                        y: 20,
                    }   
                })
               }else{
                ChartData1 = vitalsign.results.item.data1
                ChartTime1 = vitalsign.results.item.recordTime
                for(i=0; i<ChartTime1.length; i++){
                   ChartTime1[i]=ChartTime1[i].substring(0,10)
                }
                var chart = new Highcharts.Chart('container7', {
                    credits:{enabled:false},
                    chart: {
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                        // zoomType:'x',
                    }, 
                    colors:[       
                        '#FF8040',
                        '#66B3FF',
                        '#0080FF'
                        ],  
                    title: {
                        text: '肌酐',
                        x: 0,
                        y: 33,
                    },
                    xAxis: {
                        categories: ChartTime1
                    },
                    yAxis: {
                        title: {
                            text: 'umol/L',
                            x:0,
                            y:-10
                        },
                        plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                        }]
                    },
                    tooltip: {
                        valueSuffix: 'mL'
                    },
                    legend: {
                        layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                        align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                        verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                        borderWidth: 0,
                        x:0,
                        y:+50
                    },
                    series: [{
                        name: '肌酐值',
                        data: ChartData1
                    }]
                })
            }
            if(vitalsign.results.item.recordTime2.length==0){
                var chart = new Highcharts.Chart('container8', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                    }, 
                    title: {
                        text: '您没有GFR的测量数据！',
                        x: 0,
                        y: 20,
                    }   
                })
            }else{
                ChartData2 = vitalsign.results.item.data2
                ChartTime2 = vitalsign.results.item.recordTime2
                for(i=0; i<ChartTime2.length; i++){
                   ChartTime2[i]=ChartTime2[i].substring(0,10)
                }
                var chart = new Highcharts.Chart('container8', {
                    credits:{enabled:false},
                    chart: {
                        borderRadius:5,//图表边框圆角角度                    
                        shadow:true,//是否设置阴影  
                        // zoomType:'x',
                    }, 
                    colors:[       
                        '#FF8040',
                        '#66B3FF',
                        '#0080FF'
                        ],  
                    title: {
                        text: 'GFR',
                        x: 0,
                        y: 33,
                    },
                    xAxis: {
                        categories: ChartTime2
                    },
                    yAxis: {
                        title: {
                            text: 'GFR（mL/min）',
                            x:0,
                            y:-10
                        },
                        plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                        }]
                    },                   
                    legend: {
                        layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                        align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                        verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                        borderWidth: 0,
                        x:0,
                        y:+50
                    },
                    series: [{
                        name: 'GFR',
                        data: ChartData2
                    }]
                })
            }
            if(vitalsign.results.item.recordTime3.length==0){
                var chart = new Highcharts.Chart('container9', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                    }, 
                    title: {
                        text: '您没有尿蛋白的测量数据！',
                        x: 0,
                        y: 20,
                    }   
                })
            }else{
                ChartData3 = vitalsign.results.item.data3
                ChartTime3 = vitalsign.results.item.recordTime3
                for(i=0; i<ChartTime3.length; i++){
                   ChartTime3[i]=ChartTime3[i].substring(0,10)
                }
                var chart = new Highcharts.Chart('container9', {
                    credits:{enabled:false},
                    chart: {
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                        // zoomType:'x',
                    }, 
                    colors:[       
                        '#FF8040',
                        '#66B3FF',
                        '#0080FF'
                        ],  
                    title: {
                        text: '尿蛋白',
                        x: 0,
                        y: 33,
                    },
                    xAxis: {
                        categories: ChartTime3
                    },
                    yAxis: {
                        title: {
                            text: '尿蛋白（g/24h）',
                            x:0,
                            y:-10
                        },
                        plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                        }]
                    },
                    legend: {
                        layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                        align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                        verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                        borderWidth: 0,
                        x:0,
                        y:+50
                    },
                    series: [{
                        name: '尿蛋白',
                        data: ChartData3
                    }]
                })
            }
            if(vitalsign.results.item.recordTime4.length==0){
                var chart = new Highcharts.Chart('container10', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                    }, 
                    title: {
                        text: '您没有血白蛋白的测量数据！',
                        x: 0,
                        y: 20,
                    }   
                })
            }else{
                ChartData4 = vitalsign.results.item.data4
                ChartTime4 = vitalsign.results.item.recordTime4
                for(i=0; i<ChartTime4.length; i++){
                   ChartTime4[i]=ChartTime4[i].substring(0,10)
                }
                var chart = new Highcharts.Chart('container10', {
                    credits:{enabled:false},
                    chart: {
                        borderRadius:5,//图表边框圆角角度                         
                        shadow:true,//是否设置阴影  
                        // zoomType:'x',
                    }, 
                    colors:[       
                        '#FF8040',
                        '#66B3FF',
                        '#0080FF'
                        ],  
                    title: {
                        text: '血白蛋白',
                        x: 0,
                        y: 33,
                    },
                    xAxis: {
                        categories: ChartTime4
                    },
                    yAxis: {
                        title: {
                            text: '血白蛋白（g/L）',
                            x:0,
                            y:-10
                        },
                        plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                        }]
                    },
                    legend: {
                        layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                        align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                        verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                        borderWidth: 0,
                        x:0,
                        y:+50
                    },
                    series: [{
                        name: '血白蛋白',
                        data: ChartData4
                    }]
                })
            }
            if(vitalsign.results.item.recordTime5.length==0){
                var chart = new Highcharts.Chart('container11', {
                    credits:{enabled:false},
                    chart: {
                        height:50,
                        borderRadius:5,//图表边框圆角角度  
                        shadow:true,//是否设置阴影  
                    }, 
                    title: {
                        text: '您没有血红蛋白的测量数据！',
                        x: 0,
                        y: 20,
                    }   
                })
            }else{
                ChartData5 = vitalsign.results.item.data5
                ChartTime5 = vitalsign.results.item.recordTime5
                for(i=0; i<ChartTime5.length; i++){
                   ChartTime5[i]=ChartTime5[i].substring(0,10)
                }
                var chart = new Highcharts.Chart('container11', {
                    credits:{enabled:false},
                    chart: {
                        borderRadius:5,
                        shadow:true,//是否设置阴影  
                        // zoomType:'x',
                    }, 
                    colors:[       
                        '#FF8040',
                        '#66B3FF',
                        '#0080FF',
                        '#00FF00',//绿  
                        '#0000FF',//蓝  
                        '#FFFF00',//黄  
                        '#FF00FF',//紫  
                        '#FFFFFF',//紫 
                        '#000000',//黑  
                        '#FF0000',//红  
                        ],  
                    title: {
                        text: '血红蛋白',
                        x: 0,
                        y: 33,
                    },
                    xAxis: {
                        categories: ChartTime5
                    },
                    yAxis: {
                        title: {
                            text: '血红蛋白（g/L）',
                            x:0,
                            y:-10
                        },
                        plotLines: [{
                            //控制x轴线型
                            value: 0,
                            width: 0.1,
                            color: '#808080'
                        }]
                    },
                    legend: {
                        layout: 'horizontal',   //图例内容布局方式，有水平布局及垂直布局可选，对应的配置值是： “horizontal”， “vertical”
                        align: 'center',      //图例在图表中的对齐方式，有 “left”, "center", "right" 可选
                        verticalAlign: 'top', //垂直对齐方式，有 'top'， 'middle' 及 'bottom' 可选
                        borderWidth: 0,
                        x:0,
                        y:+50
                    },
                    series: [{
                        name: '血红蛋白',
                        data: ChartData5
                    }]
                })
            }
          },function(err){
        })
  }
  var ShowTime = function(date,modify,timeType){
    if(modify==0){
      if(timeType=="week"){
        document.getElementById('middle').innerText = "本周"
      }else if(timeType=="month"){
        document.getElementById('middle').innerText = "本月"
      }else if(timeType=="season"){
        document.getElementById('middle').innerText = "本季"
      }else if(timeType=="year"){
        document.getElementById('middle').innerText = "本年"
      }
    }else {
    //周
    if(timeType=="week"){
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
          function(data){
            if(data.results=="不存在该段时间的报告!"){
              var week1 = data.startTime
              var week2 = data.endTime
              week1 = week1.substring(0,10)
              week2 = week2.substring(0,10)
              document.getElementById('middle').innerText = week1+" "+week2
            }else{
              var week1 = data.results.startTime
              var week2 = data.results.endTime
              week1 = week1.substring(0,10)
              week2 = week2.substring(0,10)
              document.getElementById('middle').innerText = week1+" "+week2
            }},function(err){
          })
    }
    //月
    else if(timeType=="month"){
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
          function(data){
            if(data.results=="不存在该段时间的报告!"){
                var month = data.time
                   month1 = month.substring(0,4)
                   month2 = month.substring(4,6)
                  document.getElementById('middle').innerText = month1+"年"+month2+"月"
               }else{
                  var month = data.results.item.time
                   month1 = month.substring(0,4)
                   month2 = month.substring(4,6)
                  document.getElementById('middle').innerText = month1+"年"+month2+"月"
                  }},function(err){
          })
    }
    //季
    else if(timeType=="season"){
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
          function(data){
           if(data.results=="不存在该段时间的报告!"){
                  var season = data.time
                   season1 = season.substring(0,4)
                   season2 = season.substring(5,6)
                   document.getElementById('middle').innerText = season1+"年第"+season2+"季"
               }else{
                  var season = data.results.item.time
                   season1 = season.substring(0,4)
                   season2 = season.substring(5,6)
                   document.getElementById('middle').innerText = season1+"年第"+season2+"季"
            }},function(err){
          })
    }
    //年
    else if(timeType=="year"){
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
          function(data){
           if(data.results=="不存在该段时间的报告!"){
                var year = data.time
                document.getElementById('middle').innerText = year+"年"
               }else{
            var year = data.results.item.time
            document.getElementById('middle').innerText = year+"年"
          }},function(err){
          })
    }}
  }
  var DoctorWord = function(date,modify,timeType){
    // 医生建议
        //体温
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
          console.log(vitalsign)
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.tw = false
               }else if(vitalsign.item.recommendValue1==''){
                   $scope.tw = true
                   $scope.tw1 = "医生建议：无"
                  }else {
                    $scope.tw = true    
                    $scope.tw1 = "医生建议：体温高于"+ vitalsign.item.recommendValue1 +"℃为发热。" 
            } },function(err){
        })
        //体重
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Weight", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.tz = false
                }else if(vitalsign.item.recommendValue11==null){
                   $scope.tz = true
                   $scope.tz1 = "医生建议：无"
                  }else {
                    $scope.tz = true
                    $scope.tz1 = "医生建议：体重控制在"+ vitalsign.item.recommendValue11 +"Kg到"+ vitalsign.item.recommendValue12 +"Kg之间。" 
            } },function(err){
        })
        //血压
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "BloodPressure", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.xy = false
                }else if(vitalsign.item.recommendValue11==null){
                   $scope.xy = true
                   $scope.xy1 = "医生建议：无"
                  }else {
                    $scope.xy = true
                    $scope.xy1 = "医生建议：收缩压控制在"+ vitalsign.item.recommendValue11 +"mmHg到"+ vitalsign.item.recommendValue12 +"mmHg之间；舒张压控制在" +vitalsign.item.recommendValue13 +"mmHg到"+ vitalsign.item.recommendValue14 +"mmHg之间。"
            } },function(err){
        })
        //尿量
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Vol", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
          console.log(vitalsign)
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.nl = false
               }else if(vitalsign.item.recommendValue1==''){
                   $scope.nl = true
                   $scope.nl1 = "医生建议：无"
                  }else {
                    $scope.nl = true    
                    $scope.nl1 = "医生建议：少尿为小于"+ vitalsign.item.recommendValue1 +"mL(腹透、血透病人除外)。" 
            } },function(err){
        })
         //心率
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "HeartRate", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.xl = false
                }else if(vitalsign.item.recommendValue11==null){
                   $scope.xl = true
                   $scope.xl1 = "医生建议：无"
                  }else {
                    $scope.xl = true
                    $scope.xl1 = "医生建议：心率控制在"+ vitalsign.item.recommendValue11 +"次/分钟到"+ vitalsign.item.recommendValue12 +"次/分钟之间。" 
            } },function(err){
        })
        //腹透
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "PeritonealDialysis", showType: timeType, modify:modify-1}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.ft = false
                }else if(vitalsign.item.recommendValue11==null){
                   $scope.ft = true
                   $scope.ft1 = "医生建议：无"
                  }else {
                    $scope.ft = true
                    $scope.ft1 = "医生建议：超滤量控制在"+ vitalsign.item.recommendValue11 +"mL到"+ vitalsign.item.recommendValue12 +"mL之间。" 
            } },function(err){
        })
    //化验
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "LabTest", showType: timeType, modify:modify}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.hy = false
               }else if(modify==0){
                   $scope.hy = false
                  }else if (vitalsign.doctorReport=='') {
                    $scope.hy = true
                    $scope.hy1 = "化验：无。" 
                  }else {
                    $scope.hy = true    
                    $scope.hy1 = "化验："+ vitalsign.doctorReport +"。" 
            } },function(err){
        })
    //医生报告
        Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "DoctorReport", showType: timeType, modify:modify}).then(
         function(data){
          var vitalsign = data.results
             if(vitalsign=="不存在该段时间的报告!"){
                 $scope.bg = false
               }else if(modify==0){
                   $scope.bg = false
                  }else if (vitalsign.doctorReport=='') {
                    $scope.bg = true
                    $scope.bg1 = "医生报告：无" 
                  }else {
                    $scope.bg = true    
                    $scope.bg1= "医生报告："+ vitalsign.doctorReport +"。" 
            } },function(err){
        })
    // 医生评论（comment）
          //体温
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Temperature", showType: timeType, modify:modify}).then(
            function(data){
              var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_tw = false
                   }else if(modify==0){
                       $scope.pl_tw = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_tw = true
                        $scope.tw2 = "医生小结：无" 
                      }else {
                        $scope.pl_tw = true 
                        $scope.tw2 = "医生小结："+ vitalsign.doctorComment +"。" 
                } },function(err){
            })
          //体重
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Weight", showType: timeType, modify:modify}).then(
           function(data){
               var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_tz = false
                   }else if(modify==0){
                       $scope.pl_tz = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_tz = true
                        $scope.tz2 = "医生小结：无。" 
                      }else {
                        $scope.pl_tw = true 
                        $scope.tz2 = "医生小结："+ vitalsign.doctorComment +"。" 
             }},function(err){
          })
          //血压
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "BloodPressure", showType: timeType, modify:modify}).then(
           function(data){
               var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_xy = false
                   }else if(modify==0){
                       $scope.pl_xy = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_xy = true
                        $scope.xy2 = "医生小结：无。" 
                      }else {
                        $scope.pl_xy = true 
                        $scope.xy2 = "医生小结："+ vitalsign.doctorComment +"。" 
             }},function(err){
          })
          //尿量
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "Vol", showType: timeType, modify:modify}).then(
           function(data){
            var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_nl = false
                   }else if(modify==0){
                       $scope.pl_nl = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_nl = true
                        $scope.nl2 = "医生小结：无。" 
                      }else {
                        $scope.pl_nl = true 
                        $scope.nl2 = "医生小结："+ vitalsign.doctorComment +"。" 
             }},function(err){
          })
           //心率
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "HeartRate", showType: timeType, modify:modify}).then(
           function(data){
            var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_xl = false
                   }else if(modify==0){
                       $scope.pl_xl = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_xl = true
                        $scope.xl2 = "医生小结：无。" 
                      }else {
                        $scope.pl_xl = true 
                        $scope.xl2 = "医生小结："+ vitalsign.doctorComment +"。" 
             }},function(err){
          })
          //腹透
          Measurement.getPatientSign({token:Storage.get('TOKEN'), time: date, type: "Measure", code: "PeritonealDialysis", showType: timeType, modify:modify}).then(
           function(data){
            var vitalsign = data.results
                 if(vitalsign=="不存在该段时间的报告!"){
                     $scope.pl_ft = false
                   }else if(modify==0){
                       $scope.pl_ft = false
                      }else if (vitalsign.doctorComment=='') {
                        $scope.pl_ft = true
                        $scope.ft2 = "医生小结：无。" 
                      }else {
                        $scope.pl_ft = true 
                        $scope.ft2 = "医生小结："+ vitalsign.doctorComment +"。" 
             }},function(err){
          })

  }
  $scope.toWeekReports = function(){
      switchLoading()
      $scope.modify=0
      if ($scope.type){
        document.getElementById($scope.type).style.backgroundColor = "#FFFFFF"
        document.getElementById($scope.type).style.color = "#000000"
     }
      $scope.type = "week"
        document.getElementById('week').style.backgroundColor = "#6ac4f8"
        document.getElementById('week').style.color = "#FFFFFF"
        var date = new Date() 
        var timeType = "week"
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)        
        DoctorWord(date,$scope.modify,timeType)
  }
  $scope.toMonthReports = function(){
      switchLoading()
      $scope.modify=0
      if ($scope.type){
        document.getElementById($scope.type).style.backgroundColor = "#FFFFFF"
        document.getElementById($scope.type).style.color = "#000000"
     }
      $scope.type = "month"
        document.getElementById('month').style.backgroundColor = "#6ac4f8"
        document.getElementById('month').style.color = "#FFFFFF"
        var date = new Date() 
        var timeType = "month"
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)
        DoctorWord(date,$scope.modify,timeType)
  }
  $scope.toSeasonReports = function(){
      switchLoading()
      $scope.modify=0
      if ($scope.type){
        document.getElementById($scope.type).style.backgroundColor = "#FFFFFF"
        document.getElementById($scope.type).style.color = "#000000"
     }
      $scope.type = "season"
        document.getElementById('season').style.backgroundColor = "#6ac4f8"
        document.getElementById('season').style.color = "#FFFFFF"
        var date = new Date() 
        var timeType = "season"
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)     
        DoctorWord(date,$scope.modify,timeType)
  }
  $scope.toYearReports = function(){
      switchLoading()
      $scope.modify=0
      if ($scope.type){
        document.getElementById($scope.type).style.backgroundColor = "#FFFFFF"
        document.getElementById($scope.type).style.color = "#000000"
     }
      $scope.type = "year"
        document.getElementById('year').style.backgroundColor = "#6ac4f8"
        document.getElementById('year').style.color = "#FFFFFF"
        var date = new Date() 
        var timeType = "year"
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)
        DoctorWord(date,$scope.modify,timeType)
  }
  $scope.next = function(){
      switchLoading()
      var date = new Date()
      $scope.modify+=1
      var timeType = $scope.type
      if ($scope.modify>=0){
        $ionicLoading.show({
           template: '您已经回到当前时间！',
           duration: 1000
          })
        $scope.modify=0
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)
        DoctorWord(date,$scope.modify,timeType)
      }else{
        ShowTime(date,$scope.modify,timeType)
        Painting(date,$scope.modify,timeType)     
        DoctorWord(date,$scope.modify,timeType)
      }
  }
  $scope.last = function(){
      switchLoading()
      var date = new Date()
      $scope.modify-=1
      var timeType = $scope.type
      console.log(timeType)
      ShowTime(date,$scope.modify,timeType)
      Painting(date,$scope.modify,timeType)
      DoctorWord(date,$scope.modify,timeType)
  }
  $scope.toWeekReports()
}])

// 消息中心--PXY
.controller('messageCtrl', ['$ionicPopup', 'Counsels', '$q', '$scope', '$state', '$ionicHistory', 'News', 'Storage', 'Patient', 'Message',function ($ionicPopup, Counsels, $q, $scope, $state, $ionicHistory, News, Storage, Patient,Message) {
  var getDocNamePhoto = function (sender, doctor) {
    Patient.getDoctorLists({doctorId: sender}).then(
            function (data) {
              if (data.results[0]) {
                doctor.docName = data.results[0].name
                doctor.docPhoto = data.results[0].photoUrl
              }
            }, function (err) {
      console.log(err)
    })
            // return doctor;
  }
  //其实这边并不需要拿到消息本身，只需要拿到患者接受到的消息种类以及该种类是否未读即可（除了聊天消息），最好根据response更改Storage里unReadTxt的值
  var Lastnews = function () {
    var receiver = Storage.get('UID')
    News.getNotRead().then(
            function (data) {
                console.log(data.results)
                $scope.pay = data.results[0]
                $scope.task = data.results[1]
                $scope.insurance = data.results[2]
                $scope.refund = data.results[3]
                $scope.Info = data.results[4]
                $scope.edu = data.results[5]
            }, function (err) {
      console.log(err)
    }
        )

    // News.getNews({userId: receiver, type: 1}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.pay = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )

    // News.getNews({userId: receiver, type: 2}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.alert = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )

    // News.getNews({userId: receiver, type: 3}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.task = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )

    // News.getNews({userId: receiver, type: 5}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.insurance = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )
    // News.getNews({userId: receiver, type: 6}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.refund = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )

    //     News.getNews({userId: receiver, type: 7}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             console.log(data.results)
    //             $scope.Info = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )
    //     News.getNews({userId: receiver, type: 8}).then(
    //         function (data) {
    //           if (data.results.length) {
    //             $scope.edu = data.results[0]
    //           }
    //         }, function (err) {
    //   console.log(err)
    // }
    //     )

    News.getNewsByReadOrNot({userId: receiver, type: 11, readOrNot: 0, userRole: 'patient'}).then(
            function (data) {
              console.log(data)
              if (data.results.length) {
                for (var x in data.results) {
                  getDocNamePhoto(data.results[x].sendBy, data.results[x])
                }
              }
              $scope.chats = data.results
            }, function (err) {
      console.log(err)
    }
        )
  }
  $scope.$on('$ionicView.enter', function () {
    Lastnews()
  })

  $scope.do_refresher = function () {
    Lastnews()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.Goback = function () {
    $state.go(Storage.get('messageBackState'))
      // $ionicHistory.goBack();
  }

  var SetRead = function (message) {
    News.setReadOrNot({type:message.type}).then(
               function (data) {
              }, function (err) {
      console.log(err)
    }
            )
    Message.setMessagesRead({type:message.type,readOrNot:1}).then(
               function (data) {
              }, function (err) {
      console.log(err)
    }
            )
  }

  $scope.getConsultRecordDetail = function (ele,chat) {
    var template = ''
    // var counseltype = 0
    var counselstatus = ''
    var doctorId = chat.sendBy
    if (ele.target.nodeName == 'IMG') {
      $state.go('tab.DoctorDetail', {DoctorId: doctorId})
    } else 
    {
        // zz最新方法根据docid pid 不填写type获取最新一条咨询信息
      Counsels.getStatus({doctorId: doctorId, patientId: Storage.get('UID')})
        .then(function (data) {
          console.log(data.result)
          console.log(data.result.type)
          console.log(data.result.status)
          if (data.result.type == 1) {
            if (data.result.status == 1) { // 有尚未完成的咨询 直接进入
              $ionicPopup.confirm({
                title: '咨询确认',
                template: '您有尚未结束的咨询，点击确认可以查看历史消息，在医生完成三次问答之前，您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '咨询确认',
                template: '您的咨询已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          } else if (data.result.type == 2 || data.result.type == 3) {
            if (data.result.status == 1) { // 尚未结束的问诊
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您有尚未结束的问诊，点击确认可以查看历史消息，在医生结束该问诊之前您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您的问诊已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          }else if (data.result.type == 6 || data.result.type == 7) {
            if (data.result.status == 1) { // 尚未结束的加急咨询
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您有尚未结束的加急咨询，点击确认可以查看历史消息，在医生完成三次问答之前，您还可以对您的问题作进一步的描述。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            } else {
              $ionicPopup.confirm({
                title: '问诊确认',
                template: '您的加急咨询已结束，点击确认可以查看历史消息，但是无法继续发送消息。',
                okText: '确认',
                cancelText: '取消'
              }).then(function (res) {
                if (res) {
                  $state.go('consult-chat', {chatId: doctorId}) // 虽然传了type和status但不打算使用 byZYH 删了 byPXY
                }
              })
            }
          }
        })
        // SetRead(chat);
    }
    }

  $scope.getMessageDetail = function (message) {
    console.log(message)
    Storage.set('getMessageType', message.type)
    SetRead(message)
    $state.go('messagesDetail')
   
  }
}])
// 消息类型--PXY
.controller('VaryMessageCtrl', ['Patient', 'News', '$scope', 'Message', '$state', '$ionicHistory', 'Storage', function (Patient, News, $scope, Message, $state, $ionicHistory, Storage) {
  $scope.notInsurance = true
  $scope.notInfo = true
  var getDocNamePhoto = function (sender, doctor) {
    Patient.getDoctorLists({doctorId: sender}).then(
            function (data) {
              if (data.results[0]) {
                doctor.docName = data.results[0].name
                doctor.docPhoto = data.results[0].photoUrl
              }
                // console.log(doctor);
            }, function (err) {
      console.log(err)
    })
            // return doctor;
  }
  var varyMessage = function () {
    console.log(Storage.get('getMessageType'))
    switch (Storage.get('getMessageType')) {
      case '1':
        $scope.varyMes = {name: '支付', avatar: 'payment.png'}
        console.log($scope.varyMes)
        break
      case '2':
        $scope.varyMes = {name: '警报', avatar: 'alert.png'}
        break
      case '3':
        $scope.varyMes = {name: '任务', avatar: 'task.png'}
        break
      case '5':
        $scope.varyMes = {name: '保险'}
        $scope.notInsurance = false
        break
      case '6':
        $scope.varyMes = {name: '退款', avatar: 'payment.png'}
        break
      case '7':
        $scope.varyMes = {name: '系统'}
        $scope.notInfo = false
        break
      case '8':
        $scope.varyMes = {name: '群体教育'}
        $scope.notInfo = false
        break
    }

    Message.getMessages({userId: Storage.get('UID'), type: Storage.get('getMessageType')}).then(
            function (data) {
              if (data.results.length) {
                console.log(data.results)
                if (Storage.get('getMessageType') == 5||Storage.get('getMessageType') == 7||Storage.get('getMessageType') == 8) {
                  for (var x in data.results) {
                    getDocNamePhoto(data.results[x].sendBy, data.results[x])
                  }
                }
                $scope.messages = data.results
              }
            }, function (err) {
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    varyMessage()
  })

  $scope.do_refresher = function () {
    varyMessage()
    News.getNewsByReadOrNot({userId: Storage.get('UID'), type: Storage.get('MessageType'), readOrNot: 0,userRole: 'patient'}).then(
            function (data) {
              if (data.results) {
                console.log(data.results)
                if (data.results[0].readOrNot == 0) {
                  data.results[0].readOrNot = 1
                  News.setReadOrNot(data.results[0]).then(
                    function (data) {
                      console.log(data)
                    }, function (err) {
                    console.log(err)
                  })
                  
                }
              }
            }, function (err) {

    }

        )

    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.MoreMessageDetail = function (ele, doctorId, MessageType) {
    if (MessageType == 5) {
      if (ele.target.nodeName == 'IMG') {
        $state.go('tab.DoctorDetail', {DoctorId: doctorId})
      } else {
        $state.go('insurance')
      }
    }
  }
    // var messageType = Storage.get("getMessageType")
    // $scope.messages=angular.fromJson(Storage.get("allMessages"))[messageType]
    // console.log($scope.messages)

    // if(messageType=='ZF')
    //     $scope.avatar='payment.png'
    // else if(messageType=='JB')
    //     $scope.avatar='alert.png'
    // else if(messageType=='RW')
    //     $scope.avatar='task.png'
    // else if(messageType=='BX')
    //     $scope.avatar='security.png'

  $scope.Goback = function () {
    $ionicHistory.goBack()
  }
}])

// 更多医生
.controller('AllDoctorsCtrl', ['DoctorService','QandC', 'Service', '$interval', 'News', '$q', '$http', 'Storage', '$ionicLoading', '$scope', '$state', '$ionicPopup', '$ionicHistory', 'Dict', 'Patient', '$location',  'Counsels', 'Account', 'CONFIG', 'Expense', 'socket', function (DoctorService,QandC,Service, $interval, News, $q, $http,  Storage, $ionicLoading, $scope, $state, $ionicPopup, $ionicHistory, Dict, Patient, $location, Counsels, Account, CONFIG, Expense, socket) {
  //$scope.$on('$ionicView.leave', function () {
      // console.log($ionicHistory.currentView());
    //console.log('destroy')
    //$interval.cancel(RefreshUnread)
  //})
  // console.log('aaa')
  $scope.Goback = function () {
    $state.go('tab.myDoctors')
    // console.log($ionicHistory.backView())
    // console.log(123);
    // $ionicHistory.goBack();
  }

  // $scope.alldoctortype = '88px'
  // if (ionic.Platform.isIOS()) {
  //   $scope.alldoctortype = '108px'
  // }
  $scope.searchCont = {}
  $scope.clearSearch = function () {
    $scope.searchCont = {}
    // 清空之后获取所有医生
    ChangeSearch()
  }



  // var IsDoctor =function (Doctor) {
  //     Service.isMyDoctors({doctorId:Doctor.userId}). then(
  //         function (data) {
  //           // debugger
  //           if (data.DIC==1)
  //           Doctor.IsMyDoctor = true
  //         else Doctor.IsMyDoctor = false
  //           if (data.FD==1)
  //             Doctor.IsMyFollowDoctor=true
  //           else Doctor.IsMyFollowDoctor=false
  //         }
  //       )
  // }


  // $scope.open =false
  // $scope.trigger = function(Doctor){
  //   Doctor.open = !Doctor.open
  //   if (Doctor.open){
  //     IsDoctor(Doctor)
  //     console.log("testme")
  //   }
  // }

  $scope.Provinces = {}
  $scope.Cities = {}
    // $scope.Districts={};
  $scope.Hospitals = {}

  $scope.doctors = []
  $scope.moredata = true

  var pagecontrol = {skip: 0, limit: 10}
  var params = {province: '', city: '', workUnit: '', name: ''}
  var alldoctors = new Array()

  Dict.getDistrict({level: 1}).then(
        function (data) {
          $scope.Provinces = data.results
        },
        function (err) {
          console.log(err)
        }
    )

  $scope.loadMore = function () {
    // console.log('i am  loadMore')
    
        
    Patient.getDoctorLists({skip: pagecontrol.skip, limit: pagecontrol.limit, province: params.province, city: params.city, workUnit: params.workUnit, name: params.name}).then(function (data) {
      // console.log(data)
      $scope.$broadcast('scroll.infiniteScrollComplete')
      alldoctors = alldoctors.concat(data.results)
      $scope.doctors = alldoctors
      
      if (alldoctors.length == 0) {
        // console.log('aaa')
        $ionicLoading.show({
          template: '没有医生', duration: 1000
        })
      }
        // $scope.nexturl=data.nexturl;
      var skiploc = data.nexturl.indexOf('skip')
      pagecontrol.skip = data.nexturl.substring(skiploc + 5)
      console.log(pagecontrol.skip)
      if (data.results.length < pagecontrol.limit) { $scope.moredata = false } else { $scope.moredata = true };
    }, function (err) {
      console.log(err)
    })
  }

    // $scope.loadMore();

  var ChangeSearch = function () {
    pagecontrol = {skip: 0, limit: 10}
    alldoctors = new Array()
        // console.log($scope.Province);
    var _province = ($scope.Province && $scope.Province.province) ? $scope.Province.province.name : ''
    var _city = ($scope.City && $scope.City.city) ? $scope.City.city.name : ''
        // var _district = ($scope.District&&$scope.District.district)? $scope.District.district.name:"";
        // console.log($scope.Hospital);
    var _hospital = ($scope.Hospital && $scope.Hospital.hospitalName) ? $scope.Hospital.hospitalName.hospitalName : ''
    console.log(_hospital)
    params = {province: _province, city: _city, workUnit: _hospital, name: ($scope.searchCont.t || '')}
    $scope.loadMore()
  }

  $scope.search = function () {
        // console.log("清空了");
        // console.log($scope.searchCont.t)
    ChangeSearch()
  }

  $scope.getCity = function (province) {
    console.log(province)
    if (province != null) {
      Dict.getDistrict({level: '2', province: province.province, city: ''}).then(
              function (data) {
                $scope.Cities = data.results
                // console.log($scope.Cities);
              },
              function (err) {
                console.log(err)
              }
            )
    } else {
      $scope.Cities = {}
            // $scope.Districts ={};
      $scope.Hospitals = {}
    }

    $scope.City = ''
    $scope.Hospital = ''
    ChangeSearch()
  }

  $scope.getHospital = function (province, city) {
    console.log(city)
    if (city != null) {
      Dict.getHospital({province: province.name, city: city.name}).then(
          function (data) {
            $scope.Hospitals = data.results
          },
          function (err) {
            console.log(err)
          }
        )
    } else {
      $scope.Hospitals = {}
    }

    $scope.Hospital = ''
    ChangeSearch()
    // console.log($scope.Hospital)
  }
  
  $scope.getDoctorByHospital = function (hospital) {
    ChangeSearch()
  }
  $scope.question = function(DoctorId, charge1){
    QandC.question(DoctorId, charge1)
  }
  $scope.consult = function(DoctorId,  charge1, charge2){
    QandC.consult(DoctorId, charge1, charge2)
  }
  $scope.urgentquestion = function(DoctorId, charge1, charge3){
    console.log(DoctorId+" "+charge1+" "+charge3)
    QandC.urgentquestion(DoctorId, charge1, charge3)
  }
  $scope.getDoctorDetail = function (id) {
    $state.go('tab.DoctorDetail', {DoctorId: id})
  }

  /**
   * [申请主管医生，先判断是否已提出申请，如果是则弹窗提示不能申请，如果否再判断是否已存在主管医生，如果是则弹窗提示，确定后跳转申请页面]
   * @Author   PXY
   * @DateTime 2017-07-19
   * @param     Doctor：Object 注：页面绑定的doctor对象
   */
  $scope.applyMyDoctor = function(doctor) {
    DoctorService.ifIHaveDoc(doctor)
    // $state.go('tab.applyDoctor',{applyDoc:Doctor})
    
  }
  /**
   * [取消主管医生，删除后改变该医生的主管医生状态]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param    doctor：Object 注：页面绑定的doctor对象
   */
  $scope.cancelMyDoc = function(doctor){
    DoctorService.DeleteMyDoc().then(function(data){
      doctor.IsMyDoctor = false
    })
  }

  /**
   * [关注医生]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param     doctor：Object 注：页面绑定的doctor对象
   */
  $scope.followDoctor = function(doctor){
    DoctorService.LikeDoctor(doctor)
  }
  /**
   * [取关医生]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param     doctor：Object 注：页面绑定的doctor对象
   */
  $scope.unfollowDoctor = function(doctor){
    DoctorService.DislikeDoctor(doctor)
  }

  /**
   * [预约面诊]
   * @Author   PXY
   * @DateTime 2017-08-02
   * @param    doctor:Object 页面上绑定的医生对象
   */
  $scope.docAppointment = function(doctor){
    console.log(doctor)
    $state.go('tab.appointDoctor',{appointDoc:doctor})
  }


}])


.controller('DoctorCtrl', ['Service','DoctorService','QandC', '$interval', 'News', '$q',  '$cordovaBarcodeScanner', 'Storage', '$ionicLoading', '$scope', '$state', '$ionicPopup', 'Patient', '$ionicModal', 'Mywechat', function (Service,DoctorService,QandC, $interval, News, $q, $cordovaBarcodeScanner, Storage, $ionicLoading, $scope, $state, $ionicPopup, Patient, $ionicModal, Mywechat) {
  var GetUnread = function () {
        // console.log(new Date());
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: 0, userRole: 'patient'}).then(//
      function (data) {
          // console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
              // console.log($scope.HasUnreadMessages);
        } else {
          $scope.HasUnreadMessages = false
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
          $interval.cancel(RefreshUnread)
        }
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    // $scope.mydocStyle = {'top': '75px'}
    // if (ionic.Platform.isIOS()) {
    //   $scope.mydocStyle = {'top': '95px'}
    // }
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 60000)

  })

  $scope.$on('$ionicView.leave', function () {
      // console.log($ionicHistory.currentView());
    
      console.log('destroy')
      $interval.cancel(RefreshUnread)
  })
  var unComPatPopup = function(){
    $ionicPopup.show({
      title: '温馨提示',
      template: '您的个人信息并未完善，无法向医生发起咨询或问诊，请先前往 [我的->个人信息] 完善您的个人信息。',
      buttons: [
        {
          text: '取消',
          onTap: function (e) {
                            // e.preventDefault();
          }
        },
        {
          text: '确定',
          type: 'button-calm',
          onTap: function (e) {
            $state.go('userdetail', {last: 'consult'})
          }
        }
      ]
    })}

    // 进入咨询页面之前先判断患者的个人信息是否完善，若否则禁用咨询和问诊，并弹窗提示完善个人信息
  $scope.$on('$ionicView.beforeEnter', function () {
    Patient.getPatientDetail({userId: Storage.get('UID')}).then(function (data) {
      // console.log(data)
      if (!data.results.class) {
        $scope.DisabledConsult = true
        unComPatPopup()
      } else {
        $scope.DisabledConsult = false
      }
    }, function (err) {
      console.log(err)
      $ionicLoading.show({template: '网络错误！', duration: 1000})
    })
  })

  $scope.Goback = function () {
    $state.go('tab.myDoctors')
    // console.log($ionicHistory.backView())
    // console.log(123);
    // $ionicHistory.goBack();
  }

  $scope.openModal = function (DoctorId) {
    $state.go('tab.DoctorSchedule', {DoctorId: DoctorId})
  }

  var IsDoctor =function (Doctor) {
    Service.isMyDoctors({doctorId:Doctor.userId}). then(
        function (data) {
          // debugger
          if (data.DIC==1)
          Doctor.IsMyDoctor = true
        else Doctor.IsMyDoctor = false
          if (data.FD==1)
            Doctor.IsMyFollowDoctor=true
          else Doctor.IsMyFollowDoctor=false
        }
      )
  }

  $scope.doctor = ""
  $scope.followdoctors = []
  $scope.followmoredata = true
    // 获取我的主管医生信息
  var mydoc = function () {
    Patient.MyDocInCharge().then(
        function (data) {
          // console.log(data.results)
          if (data.message == "当前已有主管医生!") {
            $scope.hasDoctor = true
            $scope.doctor = data.results.doctorId
            console.log($scope.doctor)
            IsDoctor($scope.doctor)
              // if($ionicHistory.currentView().stateName=='tab.myDoctors'){
              //   $ionicLoading.show({
              //     template: '没有绑定的医生', duration: 1000
              // });
              // }
          } else {
            $scope.hasDoctor = false
            x = document.getElementById("message")
            // console.log(x)
            x.innerHTML = data.message
          }
        }, function (err) {
      console.log(err)
    })
  }
  mydoc()

  /*  $scope.scanbarcode = function () {
      // console.log(Storage.get("UID"))
    $cordovaBarcodeScanner.scan().then(function (imageData) {
          // alert(imageData.text);
      if (imageData.cancelled) { return }
      Patient.bindingMyDoctor({'patientId': Storage.get('UID'), 'doctorId': imageData.text}).then(function (res) {
        console.log(res)
            // alert(JSON.stringify(res))
        if (res.results == '修改成功' || res.results.errcode != '' || res.results.errcode != null) {
          $ionicPopup.alert({
            title: '绑定成功！'
          }).then(function (res) {
            mydoc()
            $scope.hasDoctor = true
                // $state.go('tab.myDoctors');
          })
        } else if (res.result == '不存在的医生ID！') {
          $ionicPopup.alert({
            title: '不存在的医生ID！'
          })
        }
      }, function () {
      })
    }, function (error) {
      console.log('An error happened -> ' + error)
    })
  }*/

  var allfollowdoctors = new Array()
  var FollowPageControl = {skip: 0, limit: 2}

  var initialPageControl = function(){
    FollowPageControl = {skip: 0, limit: 2}
    allfollowdoctors = new Array()
  }

  //$scope.hasfollowdoctors = true
  // 获取我的关注的医生信息
  $scope.myFollowdoc = function () {
    Patient.getFollowDoctors({skip: FollowPageControl.skip, limit: FollowPageControl.limit}).then(
        function (data) {
           // console.log(data)
          $scope.$broadcast('scroll.infiniteScrollComplete')
          allfollowdoctors = allfollowdoctors.concat(data.results)
          $scope.followdoctors = allfollowdoctors
          // console.log($scope.followdoctors)
          if (data.results == "未关注任何医生！") {
              $scope.hasfollowdoctors=false
          }else{
            $scope.hasfollowdoctors=true
            var skiploc = data.nexturl.indexOf('skip')  
            FollowPageControl.skip = data.nexturl.substring(skiploc + 5)
          }
          // console.log(FollowPageControl.skip)
          if (data.results.length < FollowPageControl.limit) 
            $scope.followmoredata = false
          else $scope.followmoredata = true
        }, function (err) {
      console.log(err)
    })
  }
  $scope.myFollowdoc()  
  /**
   * *[android在拉起微信支付时耗时很长，添加loading画面]
   * @Author   ZXF
   * @DateTime 2017-07-05
   * @return   {[type]}
   */
  var ionicLoadingshow = function () {
    $ionicLoading.show({
      template: '加载中...'
    })
  }
  var ionicLoadinghide = function () {
    $ionicLoading.hide()
  }

  $scope.allDoctors = function () {
    if($scope.DisabledConsult === true){
        unComPatPopup()
    }else{
      $state.go('tab.AllDoctors')

    }
    // $scope.loadMore()
  }
  $scope.consultRecord = function () {
    if($scope.DisabledConsult === true){
      unComPatPopup()
    }else{
      $state.go('tab.myConsultRecord')

    }
    // $scope.loadMore()
  }
  /**
   * [点击取消主管医生服务，取消成功后刷新主管医生]
   * @Author   PXY
   * @DateTime 2017-07-26
   */
  $scope.cancelMyDoc = function(){
    DoctorService.DeleteMyDoc().then(function(data){
      mydoc()
    },function(err){
    })
  }
  /**
   * [关注医生列表点击取关医生，取关成功后刷新关注医生列表并提示取关成功]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param    doctorId:String
   */
  $scope.unfollowDoctor = function(doctorId){
    /**
     * [关注医生]
     * @Author   PXY
     * @DateTime 2017-07-24
     * @param    {doctorId：String}
     * @return   data:Object
     */
    Patient.UnFollowDoc({doctorId: doctorId}).then(function (data) {
      if(doctorId === $scope.doctor.userId){
        $scope.doctor.IsMyFollowDoctor = false
      }
      
      initialPageControl()
      $scope.myFollowdoc()
      $ionicLoading.show({
        template: '取关成功！',
        duration: 1000,
        hideOnStateChange: true
      })
    }, function (err) {

    })
  }

  /**
   * [申请主管医生，先判断是否已提出申请，如果是则弹窗提示不能申请，如果否再判断是否已存在主管医生，如果是则弹窗提示，确定后跳转申请页面]
   * @Author   PXY
   * @DateTime 2017-07-19
   * @param     Doctor：页面绑定的doctor对象
   */
  $scope.applyMyDoctor = function(Doctor) {
    DoctorService.ifIHaveDoc(Doctor)
    
  }
  /**
   * [关注医生列表点击关注医生，关注成功后刷新关注医生列表并提示关注成功]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param    doctorId:String
   */
  $scope.followDoctor = function(doctorId){
    /**
     * [关注医生]
     * @Author   PXY
     * @DateTime 2017-07-24
     * @param    {doctorId：String}
     * @return   data:Object
     */
    Patient.FollowDoc({doctorId: doctorId}).then(function (data) {
      if(doctorId === $scope.doctor.userId){
        $scope.doctor.IsMyFollowDoctor = true
      }
      initialPageControl()
      $scope.myFollowdoc()
      $ionicLoading.show({
        template: '关注成功！',
        duration: 1000,
        hideOnStateChange: true
      })
    }, function (err) {

    })
  }
  /**
   * [预约面诊]
   * @Author   PXY
   * @DateTime 2017-08-02
   * @param    doctor:Object 页面上绑定的医生对象
   */
  $scope.docAppointment = function(doctor){
    console.log(doctor)
    $state.go('tab.appointDoctor',{appointDoc:doctor})
  }

  $scope.scanbarcode = function () {
    
    // $cordovaBarcodeScanner.scan().then(function (imageData) {
          // alert(1)
    var config = "";
    var path = $location.absUrl().split('#')[0]
    //var path = "http://patient.haihonghospitalmanagement.com/?code=" + Storage.get('code');
    Mywechat.settingConfig({url:path}).then(function(data){
      config = data.results;
      config.jsApiList = ['scanQRCode']
      // alert(config.jsApiList)
      // alert(config.debug)
      console.log(angular.toJson(config))
      wx.config({
        debug:false,
        appId:config.appId,
        timestamp:config.timestamp,
        nonceStr:config.nonceStr,
        signature:config.signature,
        jsApiList:config.jsApiList
      })
      wx.ready(function(){
        wx.checkJsApi({
            jsApiList: ['scanQRCode'],
            success: function(res) {
                wx.scanQRCode({
                  needResult:1,
                  scanType: ['qrCode','barCode'],
                  success: function(res) {
                    $scope.followDoctor(res.resultStr)
                  }
                })
            }
        });
      })
      wx.error(function(res){
        alert(res.errMsg)
      })

    // },function(err){
    // })
  // }
      // alert("scan:" +JSON.stringify(imageData))
      // if (imageData.cancelled){ 
        // return 
      // }

      // $scope.followDoctor(imageData.text)

    }, function (error) {
      console.log('An error happened -> ' + error)
    })
  }

  $scope.question = function(DoctorId, charge1){
    QandC.question(DoctorId, charge1)
  }
  $scope.consult = function(DoctorId, charge1, charge2){
    console.log(DoctorId)
    QandC.consult(DoctorId, charge1, charge2)
  }
  $scope.urgentquestion = function(DoctorId, charge1, charge3){
    console.log(DoctorId+" "+charge1+" "+charge3)
    QandC.urgentquestion(DoctorId, charge1, charge3)
  }

  $scope.getDoctorDetail = function (id) {
    $state.go('tab.DoctorDetail', {DoctorId: id})
  }
}])


.controller('DoctorDetailCtrl', ['Comment','Doctor','Service','DoctorService','QandC', '$ionicLoading',  '$http', '$ionicPopup', '$scope', '$state', '$ionicHistory', '$stateParams',  'Counsels', 'Storage', 'Account', 'CONFIG', 'Expense', 'socket', '$q', 'Patient', '$ionicModal', function (Comment, Doctor, Service,DoctorService, QandC, $ionicLoading, $http, $ionicPopup, $scope, $state, $ionicHistory, $stateParams,Counsels, Storage, Account, CONFIG, Expense, socket, $q, Patient, $ionicModal) {
  $scope.GoBack = function () {
    // console.log('111');
    // console.log($ionicHistory.backView());
    $ionicHistory.goBack()
  }
  var DoctorId = $stateParams.DoctorId

   // 进入咨询页面之前先判断患者的个人信息是否完善，若否则禁用咨询和问诊，并弹窗提示完善个人信息
  $scope.$on('$ionicView.beforeEnter', function () {
    var unComPatPopup = function(){
      $ionicPopup.show({
        title: '温馨提示',
        template: '您的个人信息并未完善，无法向医生发起咨询或问诊，请先前往 [我的->个人信息] 完善您的个人信息。',
        buttons: [
          {
            text: '取消',
            onTap: function (e) {
                              // e.preventDefault();
            }
          },
          {
            text: '确定',
            type: 'button-calm',
            onTap: function (e) {
              $state.go('userdetail', {last: 'consult'})
            }
          }
        ]})
    }
    Patient.getPatientDetail({userId: Storage.get('UID')}).then(function (data) {
      // console.log(data)
      if (!data.results.class) {
        $scope.DisabledConsult = true
        unComPatPopup()
      } else {
        $scope.DisabledConsult = false
      }
    }, function (err) {
      console.log(err)
      $ionicLoading.show({template: '网络错误！', duration: 1000})
    })
    

    var IsDoctor =function (Doctor) {
      Service.isMyDoctors({doctorId:Doctor.userId}). then(
          function (data) {
            if (data.DIC==1)
            Doctor.IsMyDoctor = true
          else Doctor.IsMyDoctor = false
            if (data.FD==1)
              Doctor.IsMyFollowDoctor=true
            else Doctor.IsMyFollowDoctor=false
          }
        )
    }

    $scope.doctor = ''

    Patient.getDoctorLists({doctorId: DoctorId}).then(
      function (data) {
        console.log(data.results)
        $scope.doctor = data.results[0]
        IsDoctor($scope.doctor)
        console.log($scope.doctor)
      },
      function (err) {
        console.log(err)
      }
    )
  })

  

  $scope.question = function(DoctorId, charge1){
    QandC.question(DoctorId, charge1)
  }
  $scope.consult = function(DoctorId, charge1, charge2){
    QandC.consult(DoctorId, charge1, charge2)
  }
  $scope.urgentquestion = function(DoctorId, charge1, charge3){
    console.log(DoctorId+" "+charge1+" "+charge3)
    QandC.urgentquestion(DoctorId, charge1, charge3)
  }
  
  /**
   * [申请主管医生，先判断是否已提出申请，如果是则弹窗提示不能申请，如果否再判断是否已存在主管医生，如果是则弹窗提示，确定后跳转申请页面]
   * @Author   PXY
   * @DateTime 2017-07-19
   * @param     Doctor：Object 注：页面绑定的doctor对象
   */
  $scope.applyMyDoctor = function(doctor) {
    DoctorService.ifIHaveDoc(doctor)
    // $state.go('tab.applyDoctor',{applyDoc:Doctor})
    
  }
  /**
   * [取消主管医生，删除后改变该医生的主管医生状态]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param    doctor：Object 注：页面绑定的doctor对象
   */
  $scope.cancelMyDoc = function(doctor){
    DoctorService.DeleteMyDoc().then(function(data){
      doctor.IsMyDoctor = false
    })
  }

  /**
   * [关注医生]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param     doctor：Object 注：页面绑定的doctor对象
   */
  $scope.followDoctor = function(doctor){
    DoctorService.LikeDoctor(doctor)
  }
  /**
   * [取关医生]
   * @Author   PXY
   * @DateTime 2017-07-26
   * @param     doctor：Object 注：页面绑定的doctor对象
   */
  $scope.unfollowDoctor = function(doctor){
    DoctorService.DislikeDoctor(doctor)
  }

  /**
   * [预约面诊]
   * @Author   PXY
   * @DateTime 2017-08-02
   * @param    doctor:Object 页面上绑定的医生对象
   */
  $scope.docAppointment = function(doctor){
    console.log(doctor)
    $state.go('tab.appointDoctor',{appointDoc:doctor})
  }

  var pagecontrol = {skip: 0, limit: 5}
  //$scope.doctorComment = {CommentId:'',CommentTime:''}
  // var data = {results: {items:[]}}
  //   data.results.items = [{
  //   item: "131*******2",
  //   scole: 4,
  //   CommentTime: 2017-07-27
  // },{
  //   item: "133*******7",
  //   scole: 5,
  //   CommentTime: 2017-08-01
  // }]
  // $scope.doctorComment = data.results.items
  $scope.hasComment = true
  Comment.getCommentsByDoc({doctorId:DoctorId,skip:pagecontrol.skip,limit:pagecontrol.limit}).then(
    function(data){
      $scope.doctorComment = data.results
      $scope.commentNum = data.num
      if (data.num<=5)
        $scope.moreComment = false
      else $scope.moreComment =true
      if (data.num==0){
        $scope.hasComment = false
        return
      }
      for (var i = $scope.doctorComment.length - 1; i >= 0; i--) {
        $scope.doctorComment[i].time = $scope.doctorComment[i].time.slice(0,10)
        $scope.doctorComment[i].ratingsObject = {
          iconOn: 'ion-ios-star',
          iconOff: 'ion-ios-star-outline',
          iconOnColor: '#FFD700', // rgb(200, 200, 100)
          iconOffColor: 'rgb(200, 100, 100)',
          rating: $scope.doctorComment[i].totalScore/2,
          minRating: 1,
          readOnly: true,
          callback: function (){
          }
        }
      }
      // $scope.doctorComment.CommentTime = data.results.items.CommentTime
    },function(err){
  })
  
  $scope.goAllComment = function(){
    console.log(DoctorId)
    $state.go('tab.DoctorComment', {DoctorId: DoctorId})
    // $state.go('tab.consult-comment',{counselId:'CL201708220001',doctorId:'U201708180001',patientId:'U201708220002'})
    // Storage.set('doctorId',id)
  }
  
  $scope.openModal = function (DoctorId) {
    $state.go('tab.DoctorSchedule', {DoctorId: DoctorId})
  }
}])

.controller('DoctorScheduleCtrl', ['Comment','Doctor','Service','DoctorService','QandC', '$ionicLoading',  '$http', '$ionicPopup', '$scope', '$state', '$ionicHistory', '$stateParams',  'Counsels', 'Storage', 'Account', 'CONFIG', 'Expense', 'socket', '$q', 'Patient', '$ionicModal', function (Comment, Doctor, Service,DoctorService, QandC, $ionicLoading, $http, $ionicPopup, $scope, $state, $ionicHistory, $stateParams,Counsels, Storage, Account, CONFIG, Expense, socket, $q, Patient, $ionicModal) {
  $scope.GoBack = function () {
    $ionicHistory.goBack()
  }
  var DoctorId = $stateParams.DoctorId
  console.log(DoctorId)

  //获取医生排班表
   function GetMyDoctors () {
    $scope.HemoTbl=[]
    var promise = Patient.getDoctorLists({doctorId: DoctorId})
    promise.then(function (data) {
      if (data.results[0]) {
        var schedules = data.results[0].schedules
        console.log(schedules)
        if (schedules) {
          for (var i = 0; i < schedules.length; i++) {
            if (schedules[i].day=='Mon'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[1] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[2] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Tue'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[3] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[4] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Wed'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[5] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[6] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Thu'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[7] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[8] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Fri'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[9] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[10] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Sat'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[11] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[12] = {'background-color': 'red'}
                }
            }
            if (schedules[i].day=='Sun'){
                if(schedules[i].time=='Morning'){
                    $scope.HemoTbl[13] = {'background-color': 'red'}
                }
                if(schedules[i].time=="Afternoon"){
                    $scope.HemoTbl[14] = {'background-color': 'red'}
                }
            }           

          }
        }
      }
    }, function () {
    })
  }
  GetMyDoctors()
}])

.controller('DoctorCommentCtrl', ['$scope', 'Comment', '$stateParams', function($scope, Comment, $stateParams){
  var pagecontrol = {skip: 0, limit: 10}
  var allComments = new Array()
  // console.log($stateParams)
  $scope.loadMore = function () {
    Comment.getCommentsByDoc({skip: pagecontrol.skip, limit: pagecontrol.limit, doctorId:$stateParams.DoctorId}).then(function (data) {
      console.log(data)
      $scope.$broadcast('scroll.infiniteScrollComplete')
      allComments = allComments.concat(data.results)
      $scope.doctorComment = allComments
      for (var i = $scope.doctorComment.length - 1; i >= 0; i--) {
        $scope.doctorComment[i].time = $scope.doctorComment[i].time.slice(0,10)
        console.log($scope.doctorComment[i].time)
        $scope.doctorComment[i].ratingsObject = {
          iconOn: 'ion-ios-star',
          iconOff: 'ion-ios-star-outline',
          iconOnColor: '#FFD700', // rgb(200, 200, 100)
          iconOffColor: 'rgb(200, 100, 100)',
          rating: $scope.doctorComment[i].totalScore/2,
          minRating: 1,
          readOnly: true,
          callback: function (){
          }
        }
      }
      pagecontrol.skip = pagecontrol.skip+pagecontrol.limit
      console.log(pagecontrol.skip)
      if (data.results.length < pagecontrol.limit) 
        { $scope.moredata = false } else { $scope.moredata = true }
    }, function (err) {
      console.log(err)
    })
  }

  $scope.loadMore();

}])

.controller('appointmentCtrl', ['Service','$ionicPopup','Patient', 'Mywechat','$ionicLoading', '$stateParams', '$scope',  '$state', 'Storage', '$ionicHistory', 'payment', function (Service,$ionicPopup, Patient, Mywechat, $ionicLoading, $stateParams, $scope, $state, Storage, $ionicHistory, payment) {
  // 拿前一个页面传参doctor对象绑定页面数据
  $scope.doctor = $stateParams.appointDoc
  // 默认显示7天内的面诊
  $scope.nextSchedual = false
  /**
   * [切换七天内和七天到十四天的面诊显示]
   * @Author   PXY
   * @DateTime 2017-08-02
   */
  $scope.switchNext = function(){
    $scope.nextSchedual = !$scope.nextSchedual
  }
  // 暂时绑定数据
  // 
  /**
   * [加载蒙层，阻止用户交互，防止提交多次]
   * @Author   PXY
   * @DateTime 2017-07-20
   */
  var ionicLoadingshow = function () {
    $ionicLoading.show({
      template: '加载中，请稍候...',
      hideOnStateChange:true

    })
  }
  /**
   * [隐藏蒙层，允许用户交互行为]
   * @Author   PXY
   * @DateTime 2017-07-20
   */
  var ionicLoadinghide = function () {
    $ionicLoading.hide()
  }

  var doctorSchedual = function(){
    Service.docSchedual({doctorId:$scope.doctor.userId}).then(function(data){
      // console.log(data.results)
      var schedules = data.results.concat()
       // console.log(schedules)
      $scope.periods = schedules.splice(0,14)
      $scope.nextDays = schedules
    })
  }
  $scope.$on('$ionicView.beforeEnter',function(){
    doctorSchedual()
  })
  

  $scope.AppointDoc = function(period){
    // console.log(period)
    var morning = period.availableTime === 'Morning'? '上午':'下午'
    $ionicPopup.confirm({
        title: '面诊预约提示',
        template: '预约医生：'+ $scope.doctor.name+ '，'+'</br>'+ '预约时间：' + period.availableDay  +'日' + morning +'，'+'</br>' + '预约地点：' + period.place +'，'+'</br>' + '确认预约？',
        cancelText: '取消',
        okText: '确认'
    }).then(function(res){
      if(res){
        ionicLoadingshow()
        var neworder = {
          'doctorId':$scope.doctor.userId,
          //freeFlag为1表示免费
          'freeFlag':0,
          'type':5,
          //面诊类型为5
          'userId': Storage.get('UID'),
          'role': 'patient',
          // 微信支付以分为单位
          'money': $scope.doctor.charge5 * 100,
          'class': '05',
          'name': '预约面诊',
          'notes': $scope.doctor.userId,
          // 'paystatus': 0,
          // 'paytime': new Date(),
          'trade_type': 'JSAPI',
          'openid': Storage.get('messageopenid'),
          'body_description': '预约面诊服务'
        }
        /**
         * *[后台根据order下订单，生成拉起微信支付所需的参数,results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信]
         * @Author   PXY
         * @DateTime 2017-07-20
         * @param    neworder：Object
         * @return   orderdata:Object
         */
        Mywechat.addOrder(neworder).then(function (orderdata) {
          // alert('orderdata:'+JSON.stringify(orderdata))
          if(orderdata.results.status !== 1){
            // var params = {
            //   'partnerid': '1480817392', // merchant id
            //   'prepayid': orderdata.results.prepay_id[0], // prepay id
            //   'noncestr': orderdata.results.nonceStr, // nonce
            //   'timestamp': orderdata.results.timestamp, // timestamp
            //   'sign': orderdata.results.paySign // signed string
            // }
            /**
             * *[微信jssdk方法，拉起微信支付]
             * @Author   PXY
             * @DateTime 2017-07-20
             */
            ionicLoadinghide()
            payment.payment(orderdata).then(function (data) {
              // alert('wechat:'+JSON.stringify(data))
             
                /**
                 * [发送预约面诊请求]
                 * @Author   PXY
                 * @DateTime 2017-07-25
                 * @param {doctorId:String,day:String,time:String}
                 */
                Service.appointDoc({doctorId: $scope.doctor.userId,day:period.availableDay,time:period.availableTime}).then(function(data){
                  // alert('apply:'+JSON.stringify(data))
                  doctorSchedual()
                  $ionicPopup.alert({
                    title:'面诊预约成功',
                    template: '请您于' + period.availableDay + '日' + morning + '至' + period.place + '就诊，您的就诊码为' + data.results.code + '，届时请向主管医生当面出示。',
                    okText: '好的'
                  })
                },function(err){
                  // alert('err:'+JSON.stringify(err))
                  //已支付可是面诊预约失败  这一步很危险
                })


            },function(reason){
              // alert(JSON.stringify(reason))
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
          }else{
            ionicLoadinghide()
            if(orderdata.results.status === 1) {
              $ionicLoading.show({
                template:orderdata.results.mesg,
                duration:1000,
                hideOnStateChange:true
              })
            }
           /**
             * [发送预约面诊请求]
             * @Author   PXY
             * @DateTime 2017-07-25
             * @param {doctorId:String,day:String,time:String}
             */
            Service.appointDoc({doctorId: $scope.doctor.userId,day:period.availableDay,time:period.availableTime}).then(function(data){
              // alert('apply:'+JSON.stringify(data))
              doctorSchedual()
              $ionicPopup.alert({
                title:'面诊预约成功',
                template: '请您于' + period.availableDay + '日' + morning + '至' + period.place + '就诊，您的就诊码为' + data.results.code + '，届时请向主管医生当面出示。',
                okText: '好的'
              })
            },function(err){
              // alert('err:'+JSON.stringify(err))
              //已支付可是面诊预约失败  这一步很危险
            })
          }
        },function(error){
          // alert(JSON.stringify(error))
        })
      }
    })
    
  }


  $scope.cancelAppoint = function(period){
    var morning = period.availableTime === 'Morning'? '上午':'下午'
    $ionicPopup.confirm({
        title: '面诊取消提示',
        template: '预约医生：'+ $scope.doctor.name+ '，'+'</br>'+ '预约时间：' + period.availableDay +'日' + morning +'，'+'</br>' + '预约地点：' + period.place +'，'+'</br>' + '确认取消预约？',
        cancelText: '算了',
        okText: '确认'
    }).then(function(res){
      if(res){
        Service.cancelAppointment({diagId: period.diagId}).then(function(data){
          $ionicLoading.show({
            template:'预约已取消',
            duration:1500,
            hideOnStateChange:true
          })
          doctorSchedual()
        },function(err){

        })
      }
    })
  }
 

}])
.controller('applyDocCtrl', ['$ionicPopup','Patient', 'Mywechat','$ionicLoading', '$stateParams', '$scope',  '$state', 'Storage', '$ionicHistory', 'payment', function ($ionicPopup, Patient, Mywechat, $ionicLoading, $stateParams, $scope, $state, Storage, $ionicHistory, payment) {
  // 拿前一个页面传参doctor对象绑定页面数据
  $scope.doctor = $stateParams.applyDoc
  // 购买时长选择范围
  for(var i = 1,items = new Array();i<=12;i++){
    items.push({Name:i+'个月',Value:i})
  }
  items.push( {Name:'24个月',Value:24})
  $scope.Durations = items

  // 默认选中的购买时长
  $scope.ChargeDuration = {Name:'一个月',Value:1}
  // 临时写的
  //$scope.doctor.charge3 = 0.01
  $scope.ChargeTotal = $scope.doctor.charge4
  /**
   * [根据选中购买时长改变总金额]
   * @Author   PXY
   * @DateTime 2017-07-20
   * @param    duration:Object eg.{Name:'一个月',Value:1}  [选中的购买时长对象]
   * @param    charge:Number     [主管医生每月收费]
   */
  $scope.changeTotal = function(duration,charge){
    $scope.ChargeTotal = duration.Value *(charge*100)/100
  }
  /**
   * [加载蒙层，阻止用户交互，防止提交多次]
   * @Author   PXY
   * @DateTime 2017-07-20
   */
  var ionicLoadingshow = function () {
    $ionicLoading.show({
      template: '加载中，请稍候...',
      hideOnStateChange:true

    })
  }
  /**
   * [隐藏蒙层，允许用户交互行为]
   * @Author   PXY
   * @DateTime 2017-07-20
   */
  var ionicLoadinghide = function () {
    $ionicLoading.hide()
  }

  $scope.SubmitRequest = function(doctorId,duration,totalAmount) {
    var applyDocPop = $ionicPopup.confirm({
      title: '主管医生申请',
      template: '您正申请'+ $scope.doctor.name +'医生的主管医生服务，服务时长：'+duration+'个月，预付金额为'+totalAmount+'元。'+ '</br>'+'若医生同意了您的申请，在服务期间，主管医生服务将为您提供全面个性化的健康方案制定和调整，数据分析解读，免费的咨询和问诊服务。若医生拒绝了您的申请，预付金额将退还到您的账号。并且在等待医生审核期间，您将无法再次申请主管医生。是否提交申请？',
      okText:'继续',
      cancelText:'取消'
    })
    applyDocPop.then(function(res){
      if(res){
        ionicLoadingshow()
        console.log(totalAmount)
        var neworder = {
          'doctorId':doctorId,
          //freeFlag为1表示免费
          'freeFlag':0,
          'type':4,
          //主管医生类型为4
          'userId': Storage.get('UID'),
          'month':duration,
          'role': 'patient',
          // 微信支付以分为单位
          'money': totalAmount * 100,
          'class': '04',
          'name': '主管医生',
          'notes': doctorId,
          // 'paystatus': 0,
          // 'paytime': new Date(),
          'trade_type': 'JSAPI',
          'openid': Storage.get('messageopenid'),
          'body_description': '主管医生服务'
        }
        /**
         * *[后台根据order下订单，生成拉起微信支付所需的参数,results.status===1表示医生设置的费用为0不需要拉起微信支付，status==0表示因活动免费也不进微信]
         * @Author   PXY
         * @DateTime 2017-07-20
         * @param    neworder：Object
         * @return   orderdata:Object
         */
        Mywechat.addOrder(neworder).then(function (orderdata) {
          // alert('orderdata:'+JSON.stringify(orderdata))
          if(orderdata.results.status !== 1){
            // var params = {
            //   'partnerid': '1480817392', // merchant id
            //   'prepayid': orderdata.results.prepay_id[0], // prepay id
            //   'noncestr': orderdata.results.nonceStr, // nonce
            //   'timestamp': orderdata.results.timestamp, // timestamp
            //   'sign': orderdata.results.paySign // signed string
            // }
            /**
             * *[微信jssdk方法，拉起微信支付]
             * @Author   PXY
             * @DateTime 2017-07-20 
             */
            ionicLoadinghide()
            payment.payment(orderdata).then(function (data) {
              // alert('wechat:'+JSON.stringify(data))
              // $q.all([
              // /**
              //  * [给医生账户‘转账’]
              //  * @Author   PXY
              //  * @DateTime 2017-07-20
              //  * @param {patientId:String,doctorId:String,type:String,money:Number}
              //  */
              //   Expense.rechargeDoctor({patientId: Storage.get('UID'), doctorId: doctorId, type: '主管医生服务', money: totalAmount}).then(function (data) {
              //     console.log(data)
              //   }, function (err) {
              //     console.log(err)
              //   }),
                /**
                 * 发送主管医生服务请求]
                 * @Author   PXY
                 * @DateTime 2017-07-25
                 * @param {doctorId:String,chargeDuration:Number}   注：chargeDuration指购买服务月份
                 */
                Patient.ApplyDocInCharge({doctorId:doctorId,chargeDuration:duration}).then(function(data){
                  // alert('apply:'+JSON.stringify(data))
                  $ionicPopup.alert({
                    template: '主管医生服务申请已提交，请耐心等待审核，在等待医生审核期间，您将无法再次申请主管医生，敬请谅解！若医生拒绝了您的申请，预付金额将退还到您的账号。',
                    okText: '好的'
                  }).then(function (e) {
                    $ionicHistory.goBack()
                  })
                },function(err){
                  // alert('err:'+JSON.stringify(err))
                  //已支付可是提交主管医生请求失败  这一步很危险
                })


            },function(reason){
              // alert(JSON.stringify(reason))
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
          }else{
            ionicLoadinghide()
            if(orderdata.results.status === 1) {
              $ionicLoading.show({
                template:orderdata.results.mesg,
                duration:1000,
                hideOnStateChange:true
              })
            }
            Patient.ApplyDocInCharge({doctorId:doctorId,chargeDuration:duration}).then(function(data){
              $ionicPopup.alert({
                template: '主管医生服务申请已提交，请耐心等待审核！若医生拒绝了您的申请，预付金额将退还到您的账号。',
                okText: '好的'
              }).then(function (e) {
                $ionicHistory.goBack()
              })
            },function(err){
              console.log(err)
            })
          }
        },function(error){
          // alert('order:'+JSON.stringify(error))
        })
      }
    })
  }
 

}])

// "我”二维码页
.controller('QRcodeCtrl', ['Patient', '$scope', '$state', '$interval', '$rootScope', 'Storage','Mywechat','Mywechatphoto', function (Patient, $scope, $state, $interval, $rootScope, Storage, Mywechat, Mywechatphoto) {
  $scope.patient = ''
  Patient.getPatientDetail({userId: Storage.get('UID')}).then(
    function (data) {
      $scope.patient = data.results
      // console.log($scope.patient)
      // console.log($scope.patient.patTDCticket)
      if ( $scope.patient.patTDCticket == null || $scope.patient.patTDCticket == undefined) {
        // console.log("yes")
        var params = {
          'role':"doctor",
          'userId': Storage.get('UID'),
          'postdata': {
            'action_name': 'QR_LIMIT_STR_SCENE',
            'action_info': {
              'scene': {
                'scene_str': Storage.get('UID')
              }
            }
          }
        }
        Mywechatphoto.createTDCticket(params).then(function (data) {
          $scope.patient.patTDCticket = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + data.results.patTDCticket
        },
            function (err) {
              console.log(err)
            })
      } else {
        // console.log("no")
        $scope.patient.patTDCticket = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + $scope.patient.patTDCticket
      }
    },
    function (err) {
      console.log(err)
    }
)
}])

// 关于--PXY
.controller('aboutCtrl', ['$scope', '$state', 'Storage', '$ionicHistory', function ($scope, $state, Storage, $ionicHistory) {
  $scope.Goback = function () {
    // console.log(123);
    $state.go('tab.mine')
    // $ionicHistory.goBack();
  }
}])

// 修改密码--PXY
.controller('changePasswordCtrl', ['$scope', '$timeout', '$state', '$ionicPopup', 'Storage', '$ionicHistory', 'User', function ($scope, $timeout, $state, $ionicPopup, Storage, $ionicHistory, User) {
  // $scope.Goback = function(){
  //   $ionicHistory.goBack();
  // }

  $scope.ishide = true
  $scope.change = {oldPassword: '', newPassword: '', confirmPassword: ''}

  $scope.passwordCheck = function (change) {
    $scope.logStatus1 = ''
    if (change.oldPassword != '') {
      var username = Storage.get('USERNAME')
      User.logIn({username: username, password: $scope.change.oldPassword, role: 'patient'})
        .then(function (succ) {
          console.log(succ)
          if (succ.mesg == "User password isn't correct!") {
            $scope.logStatus1 = '验证失败，密码错误！'
          } else {
            $scope.ishide = false
          }
        }, function (err) {
          console.log(err)
        })
        // var usernames = Storage.get('usernames').split(",");
        // var index = usernames.indexOf(username);
        // var passwords = Storage.get('passwords').split(",");
        // if(passwords[index]!=change.oldPassword){
        //   $scope.logStatus1 = "密码错误！";
        // }
        // else{
        //   $scope.logStatus1='验证成功';
        //   $timeout(function(){$scope.ishide=false;} , 500);

        // }
    } else {
      $scope.logStatus1 = '请输入旧密码！'
    }
  }

  $scope.gotoChange = function (change) {
    $scope.logStatus2 = ''
    if ((change.newPassword != '') && (change.confirmPassword != '')) {
      if (change.newPassword == change.confirmPassword) {
        if (change.newPassword.length < 6) {
          $scope.logStatus2 = '密码长度太短了！'
        } else {
          User.changePassword({phoneNo: Storage.get('USERNAME'), password: change.newPassword})
            .then(function (succ) {
              console.log(succ)
              if (succ.mesg == 'password reset success!') {
                $ionicPopup.alert({
                  title: '修改密码成功！'
                }).then(function (res) {
                  $scope.logStatus2 = '修改密码成功！'
                  $state.go('tab.mine')
                })
              }
            }, function (err) {
              console.log(err)
            })
        }

          // //把新用户和密码写入
          // var username = Storage.get('USERNAME');
          // var usernames = Storage.get('usernames').split(",");
          // var index = usernames.indexOf(username);
          // var passwords = Storage.get('passwords').split(",");
          // passwords[index] = change.newPassword;

          // $scope.logStatus2 ="修改密码成功！";
          // $timeout(function(){$scope.change={originalPassword:"",newPassword:"",confirmPassword:""};
          // $state.go('tab.tasklist');
          // $scope.ishide=true;
          // } , 500);
      } else {
        $scope.logStatus2 = '两次输入的密码不一致'
      }
    } else {
      $scope.logStatus2 = '请输入两遍新密码'
    }
  }
}])

// 肾病保险主页面--TDY
.controller('insuranceCtrl', ['$scope', '$state', '$ionicHistory', 'insurance', 'Storage', '$filter', '$ionicPopup', 'Patient', function ($scope, $state, $ionicHistory, insurance, Storage, $filter, $ionicPopup, Patient) {
  $scope.vip = false
  var IsVip = function () {
    Patient.getPatientDetail({userId: Storage.get('UID')}).then(function (data) {
      if (data.results.VIP == 1) {
        $scope.vip = true
        console.log("woshiVIP")
      }}, function (err) {
      console.log(err)
    })
  }
  IsVip()


  var show = false

  $scope.isShown = function () {
    return show
  }

  $scope.toggle = function () {
    show = !show
  }

  $scope.intension = function () {
    $state.go('intension')
  }

  $scope.expense = function () {
    $state.go('insuranceexpense')
  }

  $scope.kidneyfunction = function () {
    $state.go('kidneyfunction')
  }

  $scope.staff = function () {
    $state.go('insurancestafflogin')
  }

  $scope.submitintension = function () {
    var time = new Date()
    time = $filter('date')(time, 'yyyy-MM-dd HH:mm:ss')
    var temp = {
      'patientId': Storage.get('UID'),
      'status': 1,
      'date': time.substr(0, 10)
    }
    insurance.setPrefer(temp).then(function (data) {
      console.log(data)
      if (data.msg == '已设置意向，请等候保险专员联系') {
        $ionicPopup.show({
          title: '已收到您的保险意向，工作人员将尽快与您联系！',
          buttons: [
            {
              text: '確定',
              type: 'button-positive'
            }
          ]
        })
      }
    },
    function (err) {

    })
  }

  $scope.cancel = function () {
    $state.go('insurance')
  }
}])

// 肾病保险相关工具--TDY
.controller('insurancefunctionCtrl', ['$scope', '$state', '$http', '$ionicPopup', function ($scope, $state, $http, $ionicPopup) {
  $scope.InsuranceInfo = {
    'InsuranceAge': 25,
    'Gender': 'NotSelected',
    'InsuranceTime': '5年',
    'CalculationType': 'CalculateMoney',
    'InsuranceMoney': null,
    'InsuranceExpense': 0,
    'InsuranceParameter': 0
  }

  $scope.Kidneyfunction = {
    'Gender': 'NotSelected',
    'Age': null,
    'CreatinineUnit': 'μmol/L',
    'Creatinine': null,
    'KidneyfunctionValue': 0
  }

  $http.get('data/insruanceage1.json').success(function (data) {
    $scope.InsuranceAges = data
  })

  $scope.Genders = [
    {
      'Type': 'NotSelected',
      'Name': '请选择',
      'No': 0
    },
    {
      'Type': 'Male',
      'Name': '男',
      'No': 1
    },
    {
      'Type': 'Female',
      'Name': '女',
      'No': 2
    }
  ]

  $scope.InsuranceTimes = [
    {
      'Time': '5年'
    },
    {
      'Time': '10年'
    }
  ]

  $scope.CalculationTypes = [
    {
      'Type': 'CalculateMoney',
      'Name': '保费算保额',
      'No': 1
    },
    {
      'Type': 'CalculateExpense',
      'Name': '保额算保费',
      'No': 2
    }
  ]

  $scope.CreatinineUnits = [
    {
      'Type': 'mg/dl'
    },
    {
      'Type': 'μmol/L'
    }
  ]

  $http.get('data/InsuranceParameter.json').success(function (data) {
    dict = data
  })
  $scope.getexpense = function () {
    if ($scope.InsuranceInfo.Gender == 'NotSelected') {
      alert('请选择性别')
    } else if ($scope.InsuranceInfo.InsuranceMoney == null) {
      alert('请输入金额')
    } else {
      for (var i = 0; i < dict.length; i++) {
        if (dict[i].Age == $scope.InsuranceInfo.InsuranceAge && dict[i].Gender == $scope.InsuranceInfo.Gender && dict[i].Time == $scope.InsuranceInfo.InsuranceTime) {
          $scope.InsuranceInfo.InsuranceParameter = dict[i].Parameter
          break
        }
      }
      if ($scope.InsuranceInfo.CalculationType == 'CalculateExpense') {
        $scope.InsuranceInfo.InsuranceExpense = $scope.InsuranceInfo.InsuranceMoney * $scope.InsuranceInfo.InsuranceParameter / 1000
        // alert("您的保费为：" + $scope.InsuranceInfo.InsuranceExpense.toFixed(2) + "元")
        $ionicPopup.show({
          title: '您的保费为：' + $scope.InsuranceInfo.InsuranceExpense.toFixed(2) + '元',
          buttons: [
            {
              text: '確定',
              type: 'button-positive'
            }
          ]
        })
      } else if ($scope.InsuranceInfo.CalculationType == 'CalculateMoney') {
        $scope.InsuranceInfo.InsuranceExpense = 1000 * $scope.InsuranceInfo.InsuranceMoney / $scope.InsuranceInfo.InsuranceParameter
        // alert("您的保额为：" + $scope.InsuranceInfo.InsuranceExpense.toFixed(2) + "元")
        $ionicPopup.show({
          title: '您的保额为：' + $scope.InsuranceInfo.InsuranceExpense.toFixed(2) + '元',
          buttons: [
            {
              text: '確定',
              type: 'button-positive'
            }
          ]
        })
      }
    }
  }

  $scope.resetexpense = function () {
    $scope.InsuranceInfo = {
      'InsuranceAge': 25,
      'Gender': 'NotSelected',
      'InsuranceTime': '5年',
      'CalculationType': 'CalculateMoney',
      'InsuranceMoney': null,
      'InsuranceExpense': 0
    }
  }
  $scope.changeAge = function () {
    if ($scope.InsuranceInfo.InsuranceTime == '5年') {
      $http.get('data/insuranceage1.json').success(function (data) {
        $scope.InsuranceAges = data
      })
    } else {
      $http.get('data/insuranceage2.json').success(function (data) {
        $scope.InsuranceAges = data
      })
    }
  }
  $scope.getkidneyfunction = function () {
    if ($scope.Kidneyfunction.Age == null) {
      alert('请输入年龄')
    }
    if ($scope.Kidneyfunction.Creatinine == null) {
      alert('请输入肌酐')
    }
    if ($scope.Kidneyfunction.CreatinineUnit == 'mg/dl' && $scope.Kidneyfunction.Gender == 'Female') {
      if ($scope.Kidneyfunction.Creatinine <= 0.7) {
        $scope.Kidneyfunction.KidneyfunctionValue = 144 * Math.pow(($scope.Kidneyfunction.Creatinine / 0.7), -0.329) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      } else {
        $scope.Kidneyfunction.KidneyfunctionValue = 144 * Math.pow(($scope.Kidneyfunction.Creatinine / 0.7), -1.209) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      }
    } else if ($scope.Kidneyfunction.CreatinineUnit == 'mg/dl' && $scope.Kidneyfunction.Gender == 'Male') {
      if ($scope.Kidneyfunction.Creatinine <= 0.9) {
        $scope.Kidneyfunction.KidneyfunctionValue = 141 * Math.pow(($scope.Kidneyfunction.Creatinine / 0.9), -0.411) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      } else {
        $scope.Kidneyfunction.KidneyfunctionValue = 141 * Math.pow(($scope.Kidneyfunction.Creatinine / 0.9), -1.209) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      }
    } else if ($scope.Kidneyfunction.CreatinineUnit == 'μmol/L' && $scope.Kidneyfunction.Gender == 'Female') {
      if ($scope.Kidneyfunction.Creatinine <= 62) {
        $scope.Kidneyfunction.KidneyfunctionValue = 144 * Math.pow(($scope.Kidneyfunction.Creatinine * 0.01131 / 0.7), -0.329) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      } else {
        $scope.Kidneyfunction.KidneyfunctionValue = 144 * Math.pow(($scope.Kidneyfunction.Creatinine * 0.01131 / 0.7), -1.209) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      }
    } else if ($scope.Kidneyfunction.CreatinineUnit == 'μmol/L' && $scope.Kidneyfunction.Gender == 'Male') {
      if ($scope.Kidneyfunction.Creatinine <= 80) {
        $scope.Kidneyfunction.KidneyfunctionValue = 141 * Math.pow(($scope.Kidneyfunction.Creatinine * 0.01131 / 0.9), -0.411) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      } else {
        $scope.Kidneyfunction.KidneyfunctionValue = 141 * Math.pow(($scope.Kidneyfunction.Creatinine * 0.01131 / 0.9), -1.209) * Math.pow(0.993, $scope.Kidneyfunction.Age)
      }
    }
    var kidneyclass = ''
    if ($scope.Kidneyfunction.KidneyfunctionValue >= 90) {
      kidneyclass = '慢性肾病1期'
    } else if ($scope.Kidneyfunction.KidneyfunctionValue < 90 && $scope.Kidneyfunction.KidneyfunctionValue >= 60) {
      kidneyclass = '慢性肾病2期'
    } else if ($scope.Kidneyfunction.KidneyfunctionValue < 60 && $scope.Kidneyfunction.KidneyfunctionValue >= 30) {
      kidneyclass = '慢性肾病3期'
    } else if ($scope.Kidneyfunction.KidneyfunctionValue < 30 && $scope.Kidneyfunction.KidneyfunctionValue >= 15) {
      kidneyclass = '慢性肾病4期'
    } else if ($scope.Kidneyfunction.KidneyfunctionValue < 15) {
      kidneyclass = '慢性肾病5期'
    }
    // alert("估算您的肾小球滤过率为：" + $scope.Kidneyfunction.KidneyfunctionValue.toFixed(2) + ",您处于" +kidneyclass)
    $ionicPopup.show({
      title: '估算您的肾小球滤过率为：' + $scope.Kidneyfunction.KidneyfunctionValue.toFixed(2) + ',您处于' + kidneyclass,
      buttons: [
        {
          text: '確定',
          type: 'button-positive'
        }
      ]
    })
  }

  $scope.resetkidneyfunction = function () {
    $scope.Kidneyfunction = {
      'Gender': 'NotSelected',
      'Age': null,
      'CreatinineUnit': 'μmol/L',
      'Creatinine': null,
      'KidneyfunctionValue': 0
    }
  }
}])

// 肾病保险工作人员--TDY
.controller('insurancestaffCtrl', ['$scope', '$state', function ($scope, $state) {
  $scope.intensions =
  [
    {
      'name': '李爱国',
      'phoneNo': '15688745215'
    },
    {
      'name': '张爱民',
      'phoneNo': '17866656326'
    },
    {
      'name': '步爱家',
      'phoneNo': '13854616548'
    }
  ]

  $scope.stafflogin = function () {
    $state.go('insurancestaff')
  }

  $scope.Goback = function () {
    $state.go('insurance')
  }

  $scope.Back = function () {
    $state.go('insurancestafflogin')
  }
}])
// 咨询问卷--TDY

.controller('consultquestionCtrl', ['$ionicActionSheet', '$ionicLoading', 'Task', '$scope', '$ionicPopup',  '$state', 'Dict', 'Storage', 'Patient', 'VitalSign', '$filter', '$stateParams', 'Camera', 'Counsels', 'CONFIG', 'Health', 'Account', 'socket', function ($ionicActionSheet, $ionicLoading, Task, $scope, $ionicPopup, $state, Dict, Storage, Patient, VitalSign, $filter, $stateParams, Camera, Counsels, CONFIG, Health, Account, socket) {

  $scope.showProgress = false
  $scope.showSurgicalTime = false
  $scope.openPersonal = true
  $scope.openDiag = true
  var patientId = Storage.get('UID')
  // console.log($stateParams)
  var DoctorId = $stateParams.DoctorId
  var counselType = $stateParams.counselType
  $scope.submitable = false

  var BasicInfoInitial = function () { // 页面基本信息初始化
    $scope.BasicInfo =
    {
      'userId': patientId,
      'name': null,
      'gender': null,
      'bloodType': null,
      'hypertension': null,
      'class': null,
      'class_info': null,
      'operationTime': null,
      'allergic': null,
      'height': null,
      'weight': null,
      'birthday': null,
      'IDNo': null,
      'lastVisit': {
        'time': null,
        'hospital': null,
        'diagnosis': null
      }
    }
    Patient.getPatientDetail({userId: patientId}).then(
            function (data) {
              if (data.results != null) {
                $scope.BasicInfo = angular.merge($scope.BasicInfo, data.results)
                console.log($scope.BasicInfo)
                thisPatient = data.results
                if ($scope.BasicInfo.gender != null) {
                  $scope.BasicInfo.gender = searchObj($scope.BasicInfo.gender, $scope.Genders)
                }
                if ($scope.BasicInfo.bloodType != null) {
                  $scope.BasicInfo.bloodType = searchObj($scope.BasicInfo.bloodType, $scope.BloodTypes)
                }
                if ($scope.BasicInfo.hypertension != null) {
                  $scope.BasicInfo.hypertension = searchObj($scope.BasicInfo.hypertension, $scope.Hypers)
                }

                // VitalSign.getVitalSigns({userId: patientId, type: 'Weight'}).then(
                //     function (data) {
                //       if (data.results.length) {
                //         var n = data.results.length - 1
                //         var m = data.results[n].data.length - 1
                //         $scope.BasicInfo.weight = data.results[n].data[m] ? data.results[n].data[m].value : ''
                //       }
                //     },
                //     function (err) {
                //       console.log(err)
                //     })
              } else {
                $scope.openPersonal = false
              }
              initialDict()
                // console.log($scope.BasicInfo)
            },
            function (err) {
              console.log(err)
            }
        )

    $scope.Questionare = {
      'LastDiseaseTime': '',
      'title': '',
      'help': ''
    }
  }

  BasicInfoInitial()
  var localRefresh = function () {
        // 20140421 zxf
    $scope.items = []// HealthInfo.getall();
    var healthinfotimes = []
    if (Storage.get('consulthealthinfo') != '' && Storage.get('consulthealthinfo') != 'undefined' && Storage.get('consulthealthinfo') != null) {
      healthinfotimes = angular.fromJson(Storage.get('consulthealthinfo'))
    }
    for (var i = 0; i < healthinfotimes.length; i++) {
      Health.getHealthDetail({userId: Storage.get('UID'), insertTime: healthinfotimes[i].time}).then(
                function (data) {
                  if (data.results != null) {
                    $scope.items.push(data.results)
                  }
                },
                function (err) {
                  console.log(err)
                })
    }
  }
  $scope.$on('$ionicView.beforeEnter', function () {
    localRefresh()// 局部刷新
        // console.log($stateParams);
  })

    // 跳转修改健康信息
  $scope.gotoEditHealth = function (ele, editId) {
    if (ele.target.nodeName == 'I') {
        // console.log(121212)
      var confirmPopup = $ionicPopup.confirm({
        title: '删除提示',
        template: '记录删除后将无法恢复，\'我的\'健康信息中的记录也会同时被删除，确认删除？',
        cancelText: '取消',
        okText: '删除'
      })

      confirmPopup.then(function (res) {
        if (res) {
          // Health.deleteHealth({userId: patientId, insertTime: editId.insertTime}).then(
          //           function (data) {
          //               for (var i = 0; i < $scope.items.length; i++) {
          //                 if (editId.insertTime == $scope.items[i].insertTime) {
          //                   $scope.items.splice(i, 1)
          //                   break
          //                 }
          //               }

          //           // console.log($scope.items)
          //           },
          //           function (err) {
          //             console.log(err)
          //           })
                  // 20140421 zxf
          var healthinfotimes = angular.fromJson(Storage.get('consulthealthinfo'))
          for (var i = 0; i < healthinfotimes.length; i++) {
            if (healthinfotimes[i].time == editId.insertTime) {
              healthinfotimes.splice(i, 1)
              $scope.items.splice(i, 1)
              break
            }
          }
          Storage.set('consulthealthinfo', angular.toJson(healthinfotimes))
        }
      })
    } else {
      $state.go('tab.myHealthInfoDetail', {id: editId, caneidt: false})
    }
  }

  // console.log("Attention:"+DoctorId)
  // var patientId = "U201702080016"
  $scope.Genders =
  [
        {Name: '男', Type: 1},
        {Name: '女', Type: 2}
  ]

  $scope.BloodTypes =
  [
        {Name: 'A型', Type: 1},
        {Name: 'B型', Type: 2},
        {Name: 'AB型', Type: 3},
        {Name: 'O型', Type: 4},
        {Name: '不确定', Type: 5}
  ]

  $scope.Hypers =
  [
        {Name: '是', Type: 1},
        {Name: '否', Type: 2}
  ]

  // 从字典中搜索选中的对象。
  var searchObj = function (code, array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].Type == code || array[i].type == code || array[i].code == code) return array[i]
    };
    return '未填写'
  }

  $scope.Diseases = ''
  $scope.DiseaseDetails = ''
  $scope.timename = ''
  $scope.getDiseaseDetail = function (Disease) {
    if (Disease.typeName == '肾移植') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '手术日期'
    } else if (Disease.typeName == '血透') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '插管日期'
    } else if (Disease.typeName == '腹透') {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = '开始日期'
    } else if (Disease.typeName == 'ckd5期未透析') {
      $scope.showProgress = false
      $scope.showSurgicalTime = false
    } else {
      $scope.showProgress = true
      $scope.showSurgicalTime = false
      $scope.DiseaseDetails = Disease.details
    }
  }
  var initialDict = function () {
    Dict.getDiseaseType({category: 'patient_class'}).then(
        function (data) {
          $scope.Diseases = data.results[0].content
          console.log($scope.Diseases)
          $scope.Diseases.push($scope.Diseases[0])
          console.log($scope.Diseases)
          $scope.Diseases.shift()
          console.log($scope.Diseases)
          if ($scope.BasicInfo.class != null) {
            $scope.BasicInfo.class = searchObj($scope.BasicInfo.class, $scope.Diseases)
            if ($scope.BasicInfo.class.typeName == '血透') {
              $scope.showProgress = false
              $scope.showSurgicalTime = true
              $scope.timename = '插管日期'
            } else if ($scope.BasicInfo.class.typeName == '肾移植') {
              $scope.showProgress = false
              $scope.showSurgicalTime = true
              $scope.timename = '手术日期'
            } else if ($scope.BasicInfo.class.typeName == '腹透') {
              $scope.showProgress = false
              $scope.showSurgicalTime = true
              $scope.timename = '开始日期'
            } else if ($scope.BasicInfo.class.typeName == 'ckd5期未透析') {
              $scope.showProgress = false
              $scope.showSurgicalTime = false
            } else {
              $scope.showProgress = true
              $scope.showSurgicalTime = false
              $scope.DiseaseDetails = $scope.BasicInfo.class.details
              $scope.BasicInfo.class_info = searchObj($scope.BasicInfo.class_info[0], $scope.DiseaseDetails)
            }
          }
        // console.log($scope.Diseases)
        },
        function (err) {
          console.log(err)
        })
  }

    // if(Storage.get('consultcacheinfo')!=null&&Storage.get('consultcacheinfo')!=""&&Storage.get('consultcacheinfo')!='undefined'){
    //     $scope.Questionare=angular.fromJson(Storage.get('consultcacheinfo'))
    // }
    // console.log(angular.toJson($scope.Questionare))
    // if (Storage.get('tempquestionare') !== "" && Storage.get('tempquestionare') !== null)
    // {
    //     $scope.Questionare = angular.fromJson(Storage.get('tempquestionare'))
    // }
  // console.log($scope.Questionare)
  // console.log(Storage.get('tempquestionare'))

  // --------datepicker设置----------------
  var monthList = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  var weekDaysList = ['日', '一', '二', '三', '四', '五', '六']

  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject1.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.BasicInfo.lastVisit.time = yyyy + '-' + m + '-' + d
    }
  }

  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    inputDate: new Date(),    // Optional
    mondayFirst: false,    // Optional
    // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      DiagnosisdatePickerCallback(val)
    }
  }
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject2.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.BasicInfo.operationTime = yyyy + '-' + m + '-' + d
    }
  }
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    mondayFirst: false,    // Optional
    // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      OperationdatePickerCallback(val)
    }
  }
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject3.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.BasicInfo.birthday = yyyy + '-' + m + '-' + d
    }
  }
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    mondayFirst: false,    // Optional
    // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      BirthdatePickerCallback(val)
    }
  }
  // --------首次发病日期----------------
  var FirstDiseaseTimedatePickerCallback = function (val) {
    if (typeof (val) === 'undefined') {
      console.log('No date selected')
    } else {
      $scope.datepickerObject4.inputDate = val
      var dd = val.getDate()
      var mm = val.getMonth() + 1
      var yyyy = val.getFullYear()
      var d = dd < 10 ? ('0' + String(dd)) : String(dd)
      var m = mm < 10 ? ('0' + String(mm)) : String(mm)
      // 日期的存储格式和显示格式不一致
      $scope.Questionare.LastDiseaseTime = yyyy + '-' + m + '-' + d
    }
  }

  $scope.datepickerObject4 = {
    titleLabel: '首次发病日期',  // Optional
    todayLabel: '今天',  // Optional
    closeLabel: '取消',  // Optional
    setLabel: '设置',  // Optional
    setButtonType: 'button-assertive',  // Optional
    todayButtonType: 'button-assertive',  // Optional
    closeButtonType: 'button-assertive',  // Optional
    inputDate: new Date(),    // Optional
    mondayFirst: false,    // Optional
    // disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   // Optional
    monthList: monthList, // Optional
    templateType: 'popup', // Optional
    showTodayButton: 'false', // Optional
    modalHeaderColor: 'bar-positive', // Optional
    modalFooterColor: 'bar-positive', // Optional
    from: new Date(1900, 1, 1),   // Optional
    to: new Date(),    // Optional
    callback: function (val) {    // Mandatory
      FirstDiseaseTimedatePickerCallback(val)
    }
  }
  // --------datepicker设置结束----------------

  var MonthInterval = function (usertime) {
    interval = new Date().getTime() - Date.parse(usertime)
    return (Math.floor(interval / (24 * 3600 * 1000 * 30)))
  }

  var distinctTask = function (kidneyType, kidneyTime, kidneyDetail) {
    // debugger
    var sortNo = 1
    if (kidneyDetail) {
      var kidneyDetail = kidneyDetail[0]
    }
    switch (kidneyType) {
      case 'class_1':
                // 肾移植
        if (kidneyTime != undefined && kidneyTime != null && kidneyTime != '') {
          var month = MonthInterval(kidneyTime)
          console.log('month' + month)
          if (month >= 0 && month < 3) {
            sortNo = 1// 0-3月
          } else if (month >= 3 && month < 6) {
            sortNo = 2 // 3-6个月
          } else if (month >= 6 && month < 36) {
            sortNo = 3 // 6个月到3年
          } else if (month >= 36) {
            sortNo = 4// 对应肾移植大于3年
          }
        } else {
          sortNo = 4
        }
        break
      case 'class_2': case 'class_3':// 慢性1-4期
        if (kidneyDetail != undefined && kidneyDetail != null && kidneyDetail != '') {
          if (kidneyDetail == 'stage_5') { // "疾病活跃期"
            sortNo = 5
          } else if (kidneyDetail == 'stage_6') { // "稳定期
            sortNo = 6
          } else if (kidneyDetail == 'stage_7') { // >3年
            sortNo = 7
          }
        } else {
          sortNo = 6
        }
        break

      case 'class_4':// 慢性5期
        sortNo = 8
        break
      case 'class_5':// 血透
        sortNo = 9
        break

      case 'class_6':// 腹透
        sortNo = 10
        if (kidneyTime != undefined && kidneyTime != null && kidneyTime != '') {
          var month = MonthInterval(kidneyTime)
          // console.log('month' + month)
          if (month >= 6) {
            sortNo = 11
          }
        }
        break
    }
    return sortNo
  }

  $scope.submit = function () {
    $scope.submitable = true
    var userInfo = $.extend(true, {}, $scope.BasicInfo)
    userInfo.gender =userInfo.gender.Type
    userInfo.bloodType = userInfo.bloodType.Type
    userInfo.hypertension = userInfo.hypertension.Type
    if (userInfo.class.typeName == 'ckd5期未透析') {
      userInfo.class_info = null
    } else if (userInfo.class_info != null) {
      userInfo.class_info = userInfo.class_info.code
    }
    userInfo.class = userInfo.class.type
    Patient.editPatientDetail(userInfo).then(function (data) {
                    // 保存成功
      // console.log($scope.BasicInfo)
            // console.log(data.results);
      var patientId = Storage.get('UID')
      var task = distinctTask(data.results.class, data.results.operationTime, data.results.class_info)
      Task.insertTask({userId: patientId, sortNo: task}).then(
                function (data) {

                }, function (err) {
        console.log('err' + err)
      })
            // if($scope.BasicInfo.weight){
            //     var now = new Date() ;
            //     now =  $filter("date")(now, "yyyy-MM-dd HH:mm:ss");
            //     VitalSign.insertVitalSign({patientId:patientId, type: "Weight",code: "Weight_1", date:now.substr(0,10),datatime:now,datavalue:$scope.BasicInfo.weight,unit:"kg"}).then(function(data){
            //     // console.log($scope.BasicInfo.weight);
            //      // $state.go("tab.consultquestion2",{DoctorId:DoctorId,counselType:counselType});
            //     },function(err){
            //         console.log(err);
            //     });
            // }
    }, function (err) {
      console.log(err)
    })

    Storage.set('tempquestionare', angular.toJson($scope.Questionare))
    Storage.set('tempimgrul', angular.toJson($scope.images))
    console.log($scope.Questionare)
    var temp = {
      'patientId': patientId,
      'type': counselType,
      'doctorId': $stateParams.DoctorId,
      'hospital': $scope.BasicInfo.lastVisit.hospital,
      'visitDate': $scope.BasicInfo.lastVisit.time,
      'diagnosis': $scope.BasicInfo.lastVisit.diagnosis,
      'diagnosisPhotoUrl': $scope.images,
      'sickTime': $scope.Questionare.LastDiseaseTime,
      'symptom': $scope.Questionare.title,
      'symptomPhotoUrl': $scope.images,
      'help': $scope.Questionare.help
    }

    Counsels.questionaire(temp).then(
          function (data) {
            // alert('questionaire'+JSON.stringify(data))
              // 不能重复提交
              

              Storage.rm('tempquestionare')
              Storage.rm('tempimgrul')
              var msgContent = {
                counsel: data.results,
                type: 'card',
                counselId: data.results.counselId,
                patientId: patientId,
                patientName: $scope.BasicInfo.name,
                doctorId: DoctorId,
                fromId: patientId,
                targetId: DoctorId
              }
              var msgJson = {
                clientType: 'wechatpatient',
                contentType: 'custom',
                fromName: thisPatient.name,
                fromID: patientId,
                fromUser: {
                  avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + patientId + '_myAvatar.jpg'
                },
                targetID: DoctorId,
                targetName: '',
                targetType: 'single',
                status: 'send_going',
                createTimeInMillis: Date.now(),
                newsType: 11,
                targetRole: 'doctor',
                content: msgContent
              }
              socket.emit('newUser', {user_name: $scope.BasicInfo.name, user_id: patientId, client: 'wechatpatient'})
              socket.emit('message', {msg: msgJson, to: DoctorId, role: 'patient'})
                // $scope.$on('im:messageRes',function(event,messageRes){
                    // socket.off('messageRes');
                    // socket.emit('disconnect');
              // console.log(counselType)
              // alert('counselType'+counselType)
              if(counselType==1||counselType==6||counselType==7){
                Account.modifyCounts({patientId: Storage.get('UID'), doctorId: DoctorId, modify: 3}).then(function(data){
                  // alert('modifyCounts'+JSON.stringify(data))
                },function(err){
                  // alert('modifyError'+JSON.stringify(err))
                })
              }
              if (DoctorId == 'U201612291283') {
                var time = new Date()
                var gid = 'G' + $filter('date')(time, 'MMddHmsss')
                        // var msgdata = $state.params.msg;

                var d = {
                  teamId: '10050278',
                  counselId: data.results.counselId,
                  sponsorId: DoctorId,
                  patientId: patientId,
                  consultationId: gid,
                  status: '1'
                }
                msgContent.consultationId = gid
                var msgTeam = {
                  clientType: 'doctor',
                  targetRole: 'doctor',
                  contentType: 'custom',
                  fromID: DoctorId,
                  fromName: '陈江华',
                  fromUser: {
                    avatarPath: CONFIG.mediaUrl + 'uploads/photos/resized' + DoctorId + '_myAvatar.jpg'
                  },
                  targetID: '10050278',
                  teamId: '10050278',
                  targetName: '陈江华主任医师团队',
                  targetType: 'group',
                  status: 'send_going',
                  newsType: 13,
                  createTimeInMillis: Date.now(),
                  content: msgContent
                }
                Communication.newConsultation(d)
                        .then(function (con) {
                          console.log(con)
                            // socket.emit('newUser',{user_name:'陈江华'.name,user_id:DoctorId});
                          socket.emit('message', {msg: msgTeam, to: '10050278', role: 'patient'})
                          setTimeout(function () {
                            $state.go('consult-chat', {chatId: DoctorId})
                          }, 500)
                        }, function (er) {
                          console.error(err)
                        })
              } else {
                setTimeout(function () {
                  $state.go('consult-chat', {chatId: DoctorId})
                }, 500)
              }
                // });
          },
        function (err) {
          $scope.submitable = false
          $ionicLoading.show({
            template:'提交失败，请重新提交！',
            duration:1000
          })
          console.log(err)
        })
  }

 // 上传健康信息的点击事件----------------------------
  $scope.addHealth = function ($event) {
    $ionicActionSheet.show({
     buttons: [
       { text: '新建' },
       { text: '选择' }
     ],
     cancelOnStateChange: true,
     titleText: '上传',
     buttonClicked: function(index) {
      if(index===0){
        $scope.newHealth()
      }else{
        $scope.chooseHealths()
      }
       // return true;
     }
   })
    // $scope.openPopover($event)
  }


  // 新建个人信息的点击事件----------------------------
  $scope.newHealth = function () {
    var healthList = angular.fromJson(Storage.get('consulthealthinfo')) ? angular.fromJson(Storage.get('consulthealthinfo')) : []
    if( healthList.length >= CONFIG.maxHealthNumber) {
      $ionicLoading.show({
        template:'最多只能上传' + CONFIG.maxHealthNumber +'条健康信息',
        duration:1000,
        hideOnStateChange:true
      })
    } else {
      $state.go('tab.myHealthInfoDetail', {id: null, caneidt: true})
    }
    
    
  }
  // 选择个人信息的点击事件----------------------------
  $scope.chooseHealths = function () {
    $state.go('tab.healthList')

  }
}])

// 论坛
.controller('allpostsCtrl', ['$interval', 'News', '$scope', '$state', '$sce', '$http', 'Storage', 'Forum', '$stateParams', '$ionicPopup', '$ionicPopover', '$ionicLoading', '$ionicScrollDelegate',function ($interval, News, $scope, $state, $sce, $http, Storage, Forum, $stateParams, $ionicPopup, $ionicPopover, $ionicLoading, $ionicScrollDelegate) {
  var patientId = Storage.get('UID')
  var GetUnread = function () {
      // console.log(new Date());
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: 0, userRole: 'patient'}).then(
      function (data) {
          // console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
              // console.log($scope.HasUnreadMessages);
        } else {
          $scope.HasUnreadMessages = false
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
       $interval.cancel(RefreshUnread)
    }
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    $scope.loadMore()
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 60000)
  })

  $scope.$on('$ionicView.leave', function () {
    console.log('destroy')
    $interval.cancel(RefreshUnread)
  })

  var allposts = []
  $scope.posts = []
  $scope.moredata = true
  var pagecontrol = {skip: 0, limit: 10}

  $scope.initial = {
    item: ''
  }

  // $scope.$on('$ionicView.enter', function () {
  //   $scope.loadMore()
  // })
/**
   * [获取该患者三种帖子列表]
   * @Author   WZX
   * @DateTime 2017-08-03
   */
  $scope.loadMore = function () {
    Forum.allposts({token: Storage.get('TOKEN'), skip: pagecontrol.skip, limit: pagecontrol.limit}).then(function (data) {
      console.log(data)
      $scope.$broadcast('scroll.infiniteScrollComplete')
      allposts = allposts.concat(data.data.results)
      $scope.posts = allposts
      if (allposts.length == 0) {
        console.log('aaa')
        $ionicLoading.show({
          template: '没有帖子', duration: 1000
        })
      }
      var skiploc = data.data.nexturl.indexOf('skip')
      pagecontrol.skip = data.data.nexturl.substring(skiploc + 5)
      if (data.data.results.length < pagecontrol.limit) { $scope.moredata = false } else { $scope.moredata = true };
    }, function (err) {
      console.log(err)
    })
  }

   $scope.refresher = function () {
    pagecontrol = {skip: 0, limit: 10},
    allposts = []
    $scope.loadMore()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.myStyle = [
    {'color': 'gray'},
    {'color': 'DodgerBlue'}
  ]

  $scope.changefavoritestatus = function (tip) {
    console.log(tip)
    var param = {
      token: Storage.get('TOKEN'),
      postId: tip.postId
    }

    if (tip.favoritesstatus == 0) {
      Forum.favorite(param).then(function (data) {
            // console.log(data)
        tip.favoritesstatus = 1
        $ionicLoading.show({
          template: '收藏成功', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    } else {
      Forum.deletefavorite(param).then(function (data) {
                        // console.log(data)
        tip.favoritesstatus = 0
        pagecontrol = {skip: 0, limit: 10},
        allposts = []
        $scope.loadMore()
        $ionicLoading.show({
          template: '取消收藏', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    }
  }

// ----------------页面跳转------------------
  $scope.GoToPost = function () {
    $state.go('post')
  }
  $scope.GoToComment = function (rep) {
    $state.go('comment')
    Storage.set('POSTID', rep)
  }
  $scope.gotopostsdetail = function (tip) {
    $state.go('postsdetail')
    Storage.set('POSTID', tip)
  }
// ----------------开始搜索患者------------------
  $scope.search = {
    title: ''
  }

  // 根据帖子主题在列表中搜索
  $scope.goSearch = function () {
    if ($scope.search.title == '') {
      pagecontrol = {skip: 0, limit: 10},
      allposts = []
      $scope.loadMore()
    } else {
      $scope.moredata = false
      console.log(123)
      Forum.allposts({
        token: Storage.get('TOKEN'),
        title: $scope.search.title,
        limit: 1000,
        skip: 0
      }).then(function (data) {
        console.log(data.data)
        $scope.posts = data.data.results
        if (data.data.results.length == 0) {
          console.log('aaa')
          $ionicLoading.show({ template: '没有搜索到该帖', duration: 1000 })
        }
      }, function (err) {
        console.log(err)
      })
    }
  }

  $scope.clearSearch = function () {
    $scope.search.title = ''
    // $scope.posts = $scope.allposts
    pagecontrol = {skip: 0, limit: 10},
    allposts = []
    $scope.loadMore()
  }
    // ----------------结束搜索患者------------------
}])

.controller('mypostsCtrl', ['$interval', 'News', '$scope', '$state', '$sce', '$http', 'Storage', 'Forum', '$stateParams', '$ionicPopup', '$ionicPopover', '$ionicLoading', '$ionicScrollDelegate', function ($interval, News, $scope, $state, $sce, $http, Storage, Forum, $stateParams, $ionicPopup, $ionicPopover, $ionicLoading, $ionicScrollDelegate) {
 
 var patientId = Storage.get('UID')
  var GetUnread = function () {
      // console.log(new Date());
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: 0, userRole: 'patient'}).then(
      function (data) {
          // console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
              // console.log($scope.HasUnreadMessages);
        } else {
          $scope.HasUnreadMessages = false
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
       $interval.cancel(RefreshUnread)
    }
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    $scope.loadMore()
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 2000)
  })

  $scope.$on('$ionicView.leave', function () {
    console.log('destroy')
    $interval.cancel(RefreshUnread)
  })

  var myposts = []
  $scope.posts = []
  $scope.moredata = true
  var pagecontrol = {skip: 0, limit: 10}

  $scope.initial = {
    item: ''
  }

/**
   * [获取该患者三种帖子列表]
   * @Author   WZX
   * @DateTime 2017-08-03
   */
  $scope.loadMore = function () {
    Forum.myposts({token: Storage.get('TOKEN'), skip: pagecontrol.skip, limit: pagecontrol.limit}).then(function (data) {
      console.log(data)
      $scope.$broadcast('scroll.infiniteScrollComplete')
      myposts = myposts.concat(data.data.results)
      $scope.posts = myposts
      if (myposts.length == 0) {
        console.log('aaa')
        $ionicLoading.show({
          template: '没有帖子', duration: 1000
        })
      }
      var skiploc = data.data.nexturl.indexOf('skip')
      pagecontrol.skip = data.data.nexturl.substring(skiploc + 5)
      if (data.data.results.length < pagecontrol.limit) { $scope.moredata = false } else { $scope.moredata = true };
    }, function (err) {
      console.log(err)
    })
  }


   $scope.refresher = function () {
    pagecontrol = {skip: 0, limit: 10},
    myposts = []
    $scope.loadMore()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.myStyle = [
    {'color': 'gray'},
    {'color': 'DodgerBlue'}
  ]

  $scope.changefavoritestatus = function (tip) {
    console.log(tip)
    var param = {
      token: Storage.get('TOKEN'),
      postId: tip.postId
    }

    if (tip.favoritesstatus == 0) {
      Forum.favorite(param).then(function (data) {
            // console.log(data)
        tip.favoritesstatus = 1
        $ionicLoading.show({
          template: '收藏成功', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    } else {
      Forum.deletefavorite(param).then(function (data) {
                        // console.log(data)
        tip.favoritesstatus = 0
        pagecontrol = {skip: 0, limit: 10},
        myposts = []
        $scope.loadMore()
        $ionicLoading.show({
          template: '取消收藏', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    }
  }

  $scope.deletemyposts = function (tip) {
    var confirmPopup = $ionicPopup.confirm({
      title: '删除提示',
      template: '帖子删除后将无法恢复，确认删除？',
      cancelText: '取消',
      okText: '删除'
    })
    confirmPopup.then(function (res) {
      if (res) {
        Forum.deletepost({token: Storage.get('TOKEN'), postId: tip}).then(function (data) {
          console.log(data)
          pagecontrol = {skip: 0, limit: 10},
          myposts = []
          console.log(myposts)
          $scope.loadMore()
          $ionicLoading.show({
            template: '删除成功', duration: 1000
          })
        }, function (err) {
          console.log(err)
        })
      }
    })
  }
// ----------------页面跳转------------------
  $scope.GoToPost = function () {
    $state.go('post')
  }
  $scope.GoToComment = function (rep) {
    $state.go('comment')
    Storage.set('POSTID', rep)
  }
  $scope.gotopostsdetail = function (tip) {
    $state.go('postsdetail')
    Storage.set('POSTID', tip)
  }
    // ----------------结束页面搜索------------------
}])

.controller('mycollectionCtrl', ['$interval', 'News', '$scope', '$state', '$sce', '$http', 'Storage', 'Forum', '$stateParams', '$ionicPopup', '$ionicPopover', '$ionicLoading', '$ionicScrollDelegate', function ($interval, News, $scope, $state, $sce, $http, Storage, Forum, $stateParams, $ionicPopup, $ionicPopover, $ionicLoading, $ionicScrollDelegate) {

var patientId = Storage.get('UID')
  var GetUnread = function () {
      // console.log(new Date());
    News.getNewsByReadOrNot({userId: Storage.get('UID'), readOrNot: 0, userRole: 'patient'}).then(
      function (data) {
          // console.log(data);
        if (data.results.length) {
          $scope.HasUnreadMessages = true
              // console.log($scope.HasUnreadMessages);
        } else {
          $scope.HasUnreadMessages = false
        }
        Storage.set('unReadTxt',$scope.HasUnreadMessages)
      }, function (err) {
        if(err.status === 401 && angular.isDefined(RefreshUnread)){
       $interval.cancel(RefreshUnread)
    }
      console.log(err)
    })
  }

  $scope.$on('$ionicView.enter', function () {
    $scope.loadMore()
    $scope.HasUnreadMessages = Storage.get('unReadTxt')
    RefreshUnread = $interval(GetUnread, 2000)
  })

  $scope.$on('$ionicView.leave', function () {
    console.log('destroy')
    $interval.cancel(RefreshUnread)
  })

  var mycollection = []
  $scope.posts = []
  $scope.moredata = true
  var pagecontrol = {skip: 0, limit: 10}

  $scope.initial = {
    item: ''
  }
/**
   * [获取该患者三种帖子列表]
   * @Author   WZX
   * @DateTime 2017-08-03
   */

  $scope.loadMore = function () {
    console.log()
    Forum.mycollection({token: Storage.get('TOKEN'), skip: pagecontrol.skip, limit: pagecontrol.limit}).then(function (data) {
      console.log(data)
      $scope.$broadcast('scroll.infiniteScrollComplete')
      mycollection = mycollection.concat(data.data.results)
      $scope.posts = mycollection
      if (mycollection.length == 0) {
        console.log('aaa')
        $ionicLoading.show({
          template: '没有帖子', duration: 1000
        })
      }
      var skiploc = data.data.nexturl.indexOf('skip')
      pagecontrol.skip = data.data.nexturl.substring(skiploc + 5)
      if (data.data.results.length < pagecontrol.limit) { $scope.moredata = false } else { $scope.moredata = true };
    }, function (err) {
      console.log(err)
    })
  }

   $scope.refresher = function () {
    pagecontrol = {skip: 0, limit: 10},
    mycollection = []
    $scope.loadMore()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.myStyle = [
    {'color': 'gray'},
    {'color': 'DodgerBlue'}
  ]

  $scope.changefavoritestatus = function (tip) {
    console.log(tip)
    var param = {
      token: Storage.get('TOKEN'),
      postId: tip.postId
    }

    if (tip.favoritesstatus == 0) {
      Forum.favorite(param).then(function (data) {
            // console.log(data)
        tip.favoritesstatus = 1
        $ionicLoading.show({
          template: '收藏成功', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    } else {
      Forum.deletefavorite(param).then(function (data) {
        tip.favoritesstatus = 0
        pagecontrol = {skip: 0, limit: 10},
        mycollection = []
        $scope.loadMore()
        $ionicLoading.show({
          template: '取消收藏', duration: 1000
        })
      }, function (err) {
        console.log(err)
      })
    }
  }

// ----------------页面跳转------------------
  $scope.GoToPost = function () {
    $state.go('post')
  }
  $scope.GoToComment = function (rep) {
    $state.go('comment')
    Storage.set('POSTID', rep)
  }
  $scope.gotopostsdetail = function (tip) {
    $state.go('postsdetail')
    Storage.set('POSTID', tip)
  }
}])

.controller('postCtrl', ['$scope', '$state', 'Storage', '$ionicHistory', '$ionicPopover', 'Forum', 'Camera', 'CONFIG' , '$ionicLoading', '$timeout', '$ionicModal','$ionicScrollDelegate', 'Mywechat', '$location', function ($scope, $state, Storage, $ionicHistory, $ionicPopover, Forum, Camera, CONFIG, $ionicLoading, $timeout, $ionicModal, $ionicScrollDelegate, Mywechat, $location) {
  $scope.GoBack = function () {
    $state.go('tab.allposts')
  }
  $scope.$on('$ionicView.enter', function () {
    imgModalInit();
  })
  $scope.hasDeliver = true
  $scope.postphoto = '';
  $scope.post = {
    title:'',
    content:[{
                text: ''
            },
            {
                image:[]
            }],
    anonymous:''
    // imgurl:[]
  }
  $scope.Images=[]
  $scope.Post = function () {
    var param = {
      token: Storage.get('TOKEN'),
      title: $scope.post.title,
      content: $scope.post.content,
      time: new Date(),
      anonymous: $scope.post.anonymous
    }
    console.log('param',param)
    if($scope.post.title == ''){
       $ionicLoading.show({
          template: '输入不能为空',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
    }else{
      Forum.newpost(param).then(function (data) {
      console.log(data)
      if (data.msg == 'success') {
        $ionicLoading.show({
          template: '发帖成功',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
        $timeout(function () { $state.go('tab.allposts') }, 900)
      }
    }, function (err) {
      $scope.hasDeliver = false
      $ionicLoading.show({
        template: '发帖失败',
        noBackdrop: false,
        duration: 1000,
        hideOnStateChange: true
      })
      console.log(err)
    })
   }
  }

   $scope.onClickCamera = function ($event) {
     $scope.openPopover($event)
  }
  // $scope.reload = function () {
  //   var t = $scope.myAvatar
  //   $scope.myAvatar = ''

  //   $scope.$apply(function () {
  //     $scope.myAvatar = t
  //   })
  // }

 // 上传照片并将照片读入页面-------------------------
  // var photo_upload_display = function (imgURI) {
  //  // 给照片的名字加上时间戳
  //   var temp_photoaddress = Storage.get('UID') + '_' + new Date().getTime() + 'post.jpg'
  //   console.log(temp_photoaddress)
  //   Camera.uploadPicture(imgURI, temp_photoaddress)
  //   .then(function (res) {
  //     var data = angular.fromJson(res)
  //     // res.path_resized
  //     // 图片路径
  //     // $scope.post.imgurl.push(CONFIG.mediaUrl + String(data.path_resized) + '?' + new Date().getTime())
  //     $scope.post.content[1].image.push(CONFIG.mediaUrl + String(data.path_resized))
  //     // console.log($scope.postphoto)
  //     // $state.reload("tab.mine")
  //     // Storage.set('myAvatarpath',$scope.myAvatar);
  //     // ImagePath = $scope.postphoto;
  //     // var obj = document.getElementById("posttext");
  //     // obj.focus();
  //     // document.execCommand('InsertImage', false, ImagePath)
  //     // console.log($scope.post.content[1].image)
  //     // $scope.showflag=true;
  //   }, function (err) {
  //     console.log(err)
  //     reject(err)
  //   })
  // }
  var photo_upload_display = function(serverId){
    // $ionicLoading.show({
    //     template:'头像更新中',
    //     duration:5000
    // })
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("UID") + "_" +  "myAvatar.jpg";
    console.log(temp_photoaddress)
    var temp_name = 'resized' + Storage.get("UID") + "_" +  "myAvatar.jpg";
    Mywechat.download({serverId:serverId, name:temp_name})
    .then(function(res){
      //res.path_resized
      $timeout(function(){
          // $ionicLoading.hide();
          //图片路径
          $scope.myAvatar=CONFIG.mediaUrl + "uploads/photos/"+temp_name+'?'+new Date().getTime();
          console.log($scope.myAvatar)
          // $state.reload("tab.mine")
          // Patient.editPatientDetail({userId:Storage.get("UID"),photoUrl:$scope.myAvatar}).then(function(r){
          //   console.log(r);
          // })
          $scope.post.content[1].image.push($scope.myAvatar)
      },1000)
      
    },function(err){
      console.log(err);
      reject(err);
    })
  };
  // -----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        // --------------------------------------------
        // .fromTemplateUrl() method
  $ionicPopover.fromTemplateUrl('partials/pop/cameraPopover.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (popover) {
    $scope.popover = popover
  })
  $scope.openPopover = function ($event) {
    $scope.popover.show($event)
  }
  $scope.closePopover = function () {
    $scope.popover.hide()
  }
  // Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function () {
    $scope.popover.remove()
  })
  // Execute action on hide popover
  $scope.$on('popover.hidden', function () {
    // Execute action
  })
  // Execute action on remove popover
  $scope.$on('popover.removed', function () {
    // Execute action
  })

// 相册键的点击事件---------------------------------
  $scope.onClickCameraPhotos = function () {
   // console.log("选个照片");
    
    $scope.choosePhotos()
    $scope.closePopover()
  }
  // $scope.choosePhotos = function () {
  //   Camera.getPictureFromPhotos('gallery', true).then(function (data) {
  //       // data里存的是图像的地址
  //       // console.log(data);
  //     var imgURI = data
  //     photo_upload_display(imgURI)
  //   }, function (err) {
  //       // console.err(err);
  //     var imgURI
  //   })// 从相册获取照片结束
  // } // function结束
  $scope.choosePhotos = function() {
    var config = "";
    var path = $location.absUrl().split('#')[0]
    Mywechat.settingConfig({url:path}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['chooseImage','uploadImage']
      // alert(config.jsApiList)
      // alert(config.debug)
      console.log(angular.toJson(config))
      wx.config({
        debug:false,
        appId:config.appId,
        timestamp:config.timestamp,
        nonceStr:config.nonceStr,
        signature:config.signature,
        jsApiList:config.jsApiList
      })
      wx.ready(function(){
        wx.checkJsApi({
            jsApiList: ['chooseImage','uploadImage'],
            success: function(res) {
                wx.chooseImage({
                  count:1,
                  sizeType: ['original','compressed'],
                  sourceType: ['album'],
                  success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                  }
                })
            }
        });
      })
      wx.error(function(res){
        alert(res.errMsg)
      })

    },function(err){

    })
  }; // function结束

    // 照相机的点击事件----------------------------------
  $scope.getPhoto = function () {
      // console.log("要拍照了！");
    $scope.takePicture()
    $scope.closePopover()
  }
  $scope.isShow = true
  // $scope.takePicture = function () {
  //   Camera.getPicture('cam', true).then(function (data) {
  //     console.log(data)
  //     photo_upload_display(data)
  //   }, function (err) {
  //         // console.err(err);
  //     var imgURI
  //   })// 照相结束
  // } // function结束
  $scope.takePicture = function() {
      var config = "";
      var path = $location.absUrl().split('#')[0]
      Mywechat.settingConfig({url:path}).then(function(data){
        // alert(data.results.timestamp)
        config = data.results;
        config.jsApiList = ['chooseImage','uploadImage']
        // alert(config.jsApiList)
        // alert(config.debug)
        console.log(angular.toJson(config))
        wx.config({
          debug:false,
          appId:config.appId,
          timestamp:config.timestamp,
          nonceStr:config.nonceStr,
          signature:config.signature,
          jsApiList:config.jsApiList
        })
        wx.ready(function(){
          wx.checkJsApi({
          jsApiList: ['chooseImage','uploadImage'],
          success: function(res) {
              wx.chooseImage({
                count:1,
                sizeType: ['original','compressed'],
                sourceType: ['camera'],
                success: function(res) {
                    var localIds = res.localIds;
                    wx.uploadImage({
                       localId: localIds[0],
                       isShowProgressTips: 1, // 默认为1，显示进度提示
                        success: function (res) {
                            var serverId = res.serverId; // 返回图片的服务器端ID
                            photo_upload_display(serverId);
                        }
                    })
                }
              })
          }
          });
        })
      wx.error(function(res){
        alert(res.errMsg)
      })

      },function(err){

      })
    }; // function结束

  // $scope.showoriginal = function (resizedpath) {
  //   // $scope.openModal();
  //   // console.log(resizedpath)
  //   var originalfilepath = CONFIG.imgLargeUrl + resizedpath.slice(resizedpath.lastIndexOf('/') + 1).substr(7)
  //   // console.log(originalfilepath)
  //   // $scope.doctorimgurl=originalfilepath;

  //   $scope.imageHandle.zoomTo(1, true)
  //   $scope.imageUrl = originalfilepath
  //   $scope.modal.show()
  // }

    
  function imgModalInit () {
    $scope.zoomMin = 1;
    $scope.imageUrl = '';
    $scope.imageIndex = -1;//当前展示的图片
    $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
        // $scope.modal.show();
        $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
    }); 
  }

  $scope.showoriginal=function(resizedpath){
        // $scope.openModal();
        for (i = 0; i < $scope.post.content[1].image.length; i++) {
          var resized = $scope.post.content[1].image[i].indexOf('resized')>-1? 7:0
          $scope.Images[i] = CONFIG.imgLargeUrl+$scope.post.content[1].image[i].slice($scope.post.content[1].image[i].lastIndexOf('/')+1).substr(resized)
              // console.log('Images',$scope.Images)
              // console.log('images',$scope.image)
        }
        console.log(resizedpath)
        $scope.imageIndex = 0;
        //console.log($scope.imageIndex)
        var orginResized = resizedpath.indexOf('resized')>-1? 7:0
        var originalfilepath=CONFIG.imgLargeUrl+resizedpath.slice(resizedpath.lastIndexOf('/')+1).substr(orginResized)
        //console.log(originalfilepath)
        // $scope.doctorimgurl=originalfilepath;
        $scope.imageHandle.zoomTo(1, true);
        $scope.imageUrl = originalfilepath;
        $scope.modal.show();
    }
  //关掉图片
  $scope.closeModal = function() {
      $scope.imageHandle.zoomTo(1, true);
      $scope.modal.hide();
      // $scope.modal.remove()
  };
  //双击调整缩放
  $scope.switchZoomLevel = function() {
      if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin)
          $scope.imageHandle.zoomTo(1, true);
      else {
          $scope.imageHandle.zoomTo(5, true);
      }
  }
  //右划图片
  $scope.onSwipeRight = function () {
    if ($scope.imageIndex <= $scope.Images.length - 1 && $scope.imageIndex > 0)
      $scope.imageIndex = $scope.imageIndex - 1;
    else {
      //如果图片已经是第一张图片了，则取index = Images.length-1
      $scope.imageIndex = $scope.Images.length - 1;
    }
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }

  //左划图片
  $scope.onSwipeLeft = function () {
    if ($scope.imageIndex < $scope.Images.length - 1 && $scope.imageIndex >= 0)
      $scope.imageIndex = $scope.imageIndex + 1;
    else {
      //如果图片已经是最后一张图片了，则取index = 0
      $scope.imageIndex = 0;
    }
    //替换url，展示图片
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }

  $scope.deleteimg = function (index) {
    // somearray.removeByValue("tue");
    // console.log($scope.post.imgurl)
    // $scope.post.imgurl.splice(index, 1)
    $scope.post.content[1].image.splice(index, 1)
    // Storage.set('tempimgrul',angular.toJson($scope.images));
  }
}])

.controller('postsdetailCtrl',  ['CONFIG', '$scope', '$state', 'Storage', '$ionicHistory', 'Forum', '$http', '$ionicPopup', '$timeout', '$ionicPopover', '$ionicModal','$ionicScrollDelegate', function (CONFIG, $scope, $state, Storage, $ionicHistory, Forum, $http, $ionicPopup, $timeout, $ionicPopover, $ionicModal, $ionicScrollDelegate)  {
//----------------页面跳转------------------
  $scope.GoBack = function () {
    $state.go('tab.allposts');
  }
  $scope.GoToCommentf = function (tip) {
    $state.go('comment')
    Storage.set('POSTID', tip)
  }
  $scope.GoToReplyf = function (rep,tib) {
    $state.go('reply')
    Storage.set('POSTID', $scope.postId)
    Storage.set('COMMENTID', tib.commentId)
    Storage.set('AT', rep.userId)
  }
  $scope.GoToReply = function (tip) {
    $state.go('reply')
    Storage.set('POSTID', $scope.postId)
    Storage.set('COMMENTID', tip.commentId)
    Storage.set('AT', tip.userId)
  }

  $scope.replies=[]
  $scope.Images=[]
  var PostContent = function () { 
    Forum.postcontent({token: Storage.get('TOKEN'),postId: Storage.get('POSTID')}).then(function (data) {
            // console.log(data)
     $scope.name = data.data.sponsorName
     $scope.sponsorId = data.data.sponsorId
     $scope.postId = data.data.postId
     $scope.time = data.data.time
     $scope.avatar = data.data.avatar
     $scope.title = data.data.title
     $scope.text = data.data.content[0].text
     $scope.image = data.data.content[1].image
     $scope.replyCount = data.data.replyCount
     $scope.favoritesNum = data.data.favoritesNum
     $scope.anonymous = data.data.anonymous
     $scope.comments = data.data.replies
     for (i = 0; i < data.data.content[1].image.length; i++) {
      var resized = data.data.content[1].image[i].indexOf('resized')>-1 ? 7:0
        $scope.Images[i] = CONFIG.imgLargeUrl+data.data.content[1].image[i].slice(data.data.content[1].image[i].lastIndexOf('/')+1).substr(resized)
      // console.log('Images',$scope.Images)
      // console.log('images',$scope.image)
      }
    }, function (err) {
      console.log(err)
    })
  }
  $scope.$on('$ionicView.enter', function () {
    PostContent()
    imgModalInit();
  })

var userId = Storage.get('UID'),
    postId = $scope.postId

  $scope.ReplyOrDelete1 = function (tip) {
  if(userId == tip.userId){
       var confirmPopup = $ionicPopup.confirm({
        title: '删除提示',
        template: '评论删除后将无法恢复，确认删除？',
        cancelText: '取消',
        okText: '删除'
      })
      confirmPopup.then(function (res) {
        if (res) {
          Forum.deletecomment({token: Storage.get('TOKEN'),postId: $scope.postId,commentId: tip.commentId}).then(function (data) {
          PostContent()
          console.log(data)
          }, function (err) {
          console.log(err)
          })   
        }
      })
  }else{ 
       var confirmPopup = $ionicPopup.confirm({
        title: '回复提示',
        template: '是否对此评论进行回复，确认回复？',
        cancelText: '取消',
        okText: '确认'
      })
      confirmPopup.then(function (res) {
        if (res) {
          $scope.GoToReply(tip)
        }
      }) 
       
       }
}

$scope.ReplyOrDelete2 = function (rep,tib) {
  if(userId == rep.userId){
       var confirmPopup = $ionicPopup.confirm({
        title: '删除提示',
        template: '评论删除后将无法恢复，确认删除？',
        cancelText: '取消',
        okText: '确认'
      })
      confirmPopup.then(function (res) {
        if (res) {
          Forum.deletecomment({token: Storage.get('TOKEN'), postId: $scope.postId, commentId: tib.commentId, replyId: rep.replyId}).then(function (data) {
          PostContent()
          console.log(data)
          }, function (err) {
          console.log(err)
          })   
        }
      })
  }else{ 
       var confirmPopup = $ionicPopup.confirm({
        title: '回复提示',
        template: '是否对此评论进行回复，确认回复？',
        cancelText: '取消',
        okText: '确认'
      })
      confirmPopup.then(function (res) {
        if (res) {
          $scope.GoToReplyf(rep,tib)
        }
      }) 
       
       }
}

function imgModalInit () {
    $scope.zoomMin = 1;
    $scope.imageUrl = '';
    $scope.imageIndex = -1;//当前展示的图片
    $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
        // $scope.modal.show();
        $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
    }); 
  }

  $scope.showoriginal=function(resizedpath){
        // $scope.openModal();
        console.log(resizedpath)
        $scope.imageIndex = 0;
        //console.log($scope.imageIndex)
        var resized = resizedpath.indexOf('resized')>-1? 7 :0
        var originalfilepath=CONFIG.imgLargeUrl+resizedpath.slice(resizedpath.lastIndexOf('/')+1).substr(resized)
        //console.log(originalfilepath)
        // $scope.doctorimgurl=originalfilepath;
        $scope.imageHandle.zoomTo(1, true);
        $scope.imageUrl = originalfilepath;
        $scope.modal.show();
    }
  //关掉图片
  $scope.closeModal = function() {
      $scope.imageHandle.zoomTo(1, true);
      $scope.modal.hide();
      // $scope.modal.remove()
  };
  //双击调整缩放
  $scope.switchZoomLevel = function() {
      if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin)
          $scope.imageHandle.zoomTo(1, true);
      else {
          $scope.imageHandle.zoomTo(5, true);
      }
  }
  //右划图片
  $scope.onSwipeRight = function () {
    if ($scope.imageIndex <= $scope.Images.length - 1 && $scope.imageIndex > 0)
      $scope.imageIndex = $scope.imageIndex - 1;
    else {
      //如果图片已经是第一张图片了，则取index = Images.length-1
      $scope.imageIndex = $scope.Images.length - 1;
    }
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }

  //左划图片
  $scope.onSwipeLeft = function () {
    if ($scope.imageIndex < $scope.Images.length - 1 && $scope.imageIndex >= 0)
      $scope.imageIndex = $scope.imageIndex + 1;
    else {
      //如果图片已经是最后一张图片了，则取index = 0
      $scope.imageIndex = 0;
    }
    //替换url，展示图片
    $scope.imageUrl = $scope.Images[$scope.imageIndex];
  }  

}])

.controller('commentCtrl', ['$scope', '$state', 'Storage', '$ionicHistory', 'Forum', '$ionicLoading', '$timeout',function ($scope, $state, Storage, $ionicHistory, Forum, $ionicLoading, $timeout) {
 // debugger
  $scope.GoBack = function () {
    $ionicHistory.goBack();
  }
  
  $scope.hasDeliver = true
  $scope.post = {
    content:'',
  }

  $scope.Post = function () {
    var param = {
      token: Storage.get('TOKEN'),
      content: $scope.post.content,
      time: new Date(),
      postId:Storage.get('POSTID')
    }
    console.log('param',param)
    if($scope.post.content == ''){
      $ionicLoading.show({
          template: '输入不能为空',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
    }else{
        Forum.comment(param).then(function (data) {
      console.log(data)
      if (data.msg == 'success') {
        $ionicLoading.show({
          template: '提交成功',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
        $timeout(function () { $ionicHistory.goBack() }, 900)
      }
    }, function (err) {
      $scope.hasDeliver = false
      $ionicLoading.show({
        template: '提交失败',
        noBackdrop: false,
        duration: 1000,
        hideOnStateChange: true
      })
      console.log(err)
    }) 
   }  
  }

}])

.controller('replyCtrl', ['$scope', '$state', 'Storage', '$ionicHistory', 'Forum', '$ionicLoading', '$timeout',function ($scope, $state, Storage, $ionicHistory, Forum, $ionicLoading, $timeout) {
 // debugger
  $scope.GoBack = function () {
    $ionicHistory.goBack();
  }
  
  $scope.hasDeliver = true
  $scope.reply = {
    content:'',
  }

  $scope.Reply = function () {
    var param = {
      token: Storage.get('TOKEN'),
      content: $scope.reply.content,
      time: new Date(),
      postId:Storage.get('POSTID'),
      commentId:Storage.get('COMMENTID'),
      at:Storage.get('AT'),
    }
    console.log('param',param)
    if($scope.reply.content == ''){
      $ionicLoading.show({
          template: '输入不能为空',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
    }else{
      Forum.reply(param).then(function (data) {
      console.log(data)
      if (data.msg == 'success') {
        $ionicLoading.show({
          template: '提交成功',
          noBackdrop: false,
          duration: 1000,
          hideOnStateChange: true
        })
        $timeout(function () { $ionicHistory.goBack() }, 900)
      }
    }, function (err) {
      $scope.hasDeliver = false
      $ionicLoading.show({
        template: '提交失败',
        noBackdrop: false,
        duration: 1000,
        hideOnStateChange: true
      })
      console.log(err)
    })   
   }   
  }

}])

// 写评论
.controller('SetCommentCtrl', ['$stateParams', '$scope', '$ionicHistory', '$ionicLoading', '$state', 'Storage', 'Counsels', 'Comment',
  function ($stateParams, $scope, $ionicHistory, $ionicLoading, $state, Storage, Counsels, Comment) {
    $scope.comment = {score: 5, commentContent: ''}
    $scope.editable = false

      // //  //评论星星初始化
    $scope.ratingsObject = {
      iconOn: 'ion-ios-star',
      iconOff: 'ion-ios-star-outline',
      iconOnColor: '#FFD700', // rgb(200, 200, 100)
      iconOffColor: 'rgb(200, 100, 100)',
      rating: 5,
      minRating: 1,
      readOnly: false,
      callback: function (rating) {
        $scope.ratingsCallback(rating)
      }
    }
      // $stateParams.counselId
       // 获取历史评论
       // console.log($stateParams);
    if ($stateParams.counselId != undefined && $stateParams.counselId != '' && $stateParams.counselId != null) {
        // console.log($stateParams.counselId)
      Comment.getCommentsByC({counselId: $stateParams.counselId}).then(function (data) {
            // console.log('attention');
            // console.log(data);
        if (data.results.length) {
                // //初始化
          $scope.comment.score = data.results[0].totalScore / 2
          $scope.comment.commentContent = data.results[0].content
                 // 评论星星初始化
          $scope.$broadcast('changeratingstar', $scope.comment.score, true)
          $scope.editable = true
        }
      }, function (err) {
        console.log(err)
      })
    }

      // 评论星星点击改变分数
    $scope.ratingsCallback = function (rating) {
      $scope.comment.score = rating
      console.log($scope.comment.score)
    }

      // 上传评论-有效性验证
    $scope.deliverComment = function () {
        // if($scope.comment.commentContent.length <10)
        // {
        //     $ionicLoading.show({
        //       template: '输入字数不足10字',
        //       noBackdrop: false,
        //       duration: 1000,
        //       hideOnStateChange: true
        //     });
        // }

        // else
        // {//20170504 zxf
      Counsels.insertCommentScore({doctorId: $stateParams.doctorId, patientId: $stateParams.patientId, counselId: $stateParams.counselId, totalScore: $scope.comment.score * 2, content: $scope.comment.commentContent})
          // Counsels.insertCommentScore({doctorId:"doc01",patientId:"p01",counselId:"counsel01",totalScore:$scope.comment.score,content:$scope.comment.commentContent})
          .then(function (data) {
            if (data.result == '成功') { // 插入成功
              $ionicLoading.show({
                template: '评价成功',
                noBackdrop: false,
                duration: 1000,
                hideOnStateChange: true
              })
              // 提交結束之後不能繼續修改
              $scope.$broadcast('changeratingstar', $scope.comment.score, true)
              $scope.editable = true
            }
          }, function (err) {
            console.log(err)
          })
          // SetComment();
        // }
    }
      // $scope.Goback=function(){
      //   $ionicHistory.goBack();
      // }
  }])
.controller('paymentCtrl', ['$scope', '$state', '$ionicHistory', 'Storage', function ($scope, $state, $ionicHistory, Storage) {

  $scope.payFor = Storage.get('payFor')// 1->充咨询次数 2->充问诊
    // $scope.payFor=1
  $scope.money = 50
  $scope.pay = function (m) {
    if ($scope.payFor == 1) {
      if (m % 50) {
        $scope.msg = '无效的金额,'
      }
    } else {
      $scope.money = 250
    }
        // 微信支付
  }
  console.log($scope.payFor)
}])

.controller('adviceCtrl', ['$scope', '$state', '$ionicLoading', 'Advice', 'Storage', '$timeout', function ($scope, $state, $ionicLoading, Advice, Storage, $timeout) {

  $scope.deliverAdvice = function (adv) {
        // console.log(adv);
    $scope.hasDeliver = true
    Advice.postAdvice({userId: Storage.get('UID'), role: 'patient', content: adv.content}).then(
            function (data) {
                // console.log(data);
              if (data.result == '新建成功') {
                $ionicLoading.show({
                  template: '提交成功',
                  noBackdrop: false,
                  duration: 1000,
                  hideOnStateChange: true
                })
                $timeout(function () { $state.go('tab.mine') }, 900)
              }
            }, function (err) {
      $scope.hasDeliver = false
      $ionicLoading.show({
        template: '提交失败',
        noBackdrop: false,
        duration: 1000,
        hideOnStateChange: true
      })
    })
  }
}])

// .controller('devicesCtrl', ['$http','$scope', '$ionicPopup', '$cordovaBarcodeScanner', 'Devicedata', 'Storage', 'Mywechat', function ($http,$scope, $ionicPopup, $cordovaBarcodeScanner, Devicedata, Storage, Mywechat) {
//   // console.log('deviceCtrl')
//   $scope.deviceList = [{name: 'n1'}]
//   var refresh = function () {
//     Devicedata.devices({userId: Storage.get('UID')})
//         .then(function (data) {
//           console.log(data)
//           $scope.deviceList = data.results
//         }, function (err) {
//           console.log(err)
//         })
//   }
//   refresh()
//   $scope.deleteDevice = function (index) {
//     console.log('delete')
//     Devicedata.BPDeviceDeBinding({appId: 'ssgj', sn: $scope.deviceList[index].deviceInfo.sn, imei: $scope.deviceList[index].deviceInfo.imei, userId: Storage.get('UID')})
//         .then(function (succ) {
//           console.log(succ)
//           refresh()
//         }, function (err) {
//           console.log(err)
//         })
//   }

 

//   $scope.scanbarcode = function () {
//         // console.log(Storage.get("UID"))
//     // $cordovaBarcodeScanner.scan().then(function (imageData) {
//             // alert(imageData.text);
//       // if (imageData.cancelled) { return }
//     var config = "";
//     var path = $location.absUrl().split('?')[0]
//     //var path = "http://patient.haihonghospitalmanagement.com/?code=" + Storage.get('code');
//     Mywechat.settingConfig({url:path}).then(function(data){
//       // alert(data.results.timestamp)
//       config = data.results;
//       config.jsApiList = ['scanQRCode']
//       // alert(config.jsApiList)
//       // alert(config.debug)
//       console.log(angular.toJson(config))
//       wx.config({
//         debug:false,
//         appId:config.appId,
//         timestamp:config.timestamp,
//         nonceStr:config.nonceStr,
//         signature:config.signature,
//         jsApiList:config.jsApiList
//       })
//       wx.ready(function(){
//         wx.checkJsApi({
//             jsApiList: ['scanQRCode'],
//             success: function(res) {
//                 wx.scanQRCode({
//                   needResult:1,
//                   scanType: ['qrCode','barCode'],
//                   success: function(res) {
//                     $ionicPopup.show({
//                     title: '确定绑定此设备？',
//                     cssClass: 'popupWithKeyboard',
//                     buttons: [{
//                       text: '确定',
//                       onTap: function (e) {
//                         console.log('ok')
//                     Devicedata.BPDeviceBinding({appId: 'ssgj', twoDimensionalCode: imageData.text, userId: Storage.get('UID')})
//                         .then(function (succ) {
//                           if (succ.results.requestStatus == 'Success') {
//                             $ionicPopup.alert({
//                               title: '绑定成功！',
//                               template: '在设备列表页面向左滑动设备标签可以解除绑定',
//                               okText: '好的'
//                             })
//                             refresh()
//                           } else {
//                             var name = succ.results.substr(0, 1) + '*'
//                             $ionicPopup.alert({
//                               title: '警告',
//                               template: '该血压计已被' + name + '绑定，需要原使用者解除绑定后您才能绑定该设备',
//                               okText: '好的'
//                             })
//                           }
//                           console.log(succ)
//                         }, function (err) {
//                           $ionicPopup.alert({
//                             title: '绑定失败,未知原因',
//                             okText: '好的'
//                           })
//                           console.log(err)
//                         })
//           }
//         }, {
//           text: '取消',
//           onTap: function (e) {
//             console.log('cancle')
//           }
//         }]
//       })
//                   }
//                 })
//             }
//         });
//       })
//       wx.error(function(res){
//         alert(res.errMsg)
//       })

      
//     }, function (error) {
//       console.log('An error happened -> ' + error)
//     })
//   }
// }])

// 选择健康信息
.controller('healthListCtrl', ['CONFIG', '$scope', '$ionicHistory', 'Health', '$state', 'Storage', '$ionicLoading', function (CONFIG, $scope, $ionicHistory, Health, $state, Storage, $ionicLoading) {
  var patientId = Storage.get('UID')

  $scope.items = new Array()// HealthInfo.getall();
  var healthCache = angular.fromJson(Storage.get('consulthealthinfo')) ? angular.fromJson(Storage.get('consulthealthinfo')) : []
  var cushion = false // 缓冲一下，别刚选中第3条时就出现弹窗提示
  var RefreshHealthRecords = function () {
    $scope.noHealth = false

    Health.getAllHealths({userId: patientId}).then(
        function (data) {
          if (data.results != '' && data.results != null) {
            $scope.items = data.results
            // console.log($scope.items)
            var find = 0
            if (healthCache.length) {
              for (var i = 0; i < $scope.items.length; i++) {
                for (var j = 0; j < healthCache.length; j++) {
                  if ($scope.items[i].insertTime === healthCache[j].time) {
                    $scope.items[i].selected = true
                    ++find
                    break
                  }
                }
                if (find >= healthCache.length) {
                  break
                }
              }
            }
          } else {
            $scope.noHealth = true
          }
        },
        function (err) {
          console.log(err)
        }
      )
  }
  
  $scope.$on('$ionicView.enter', function () {
    $scope.maxNumber = CONFIG.maxHealthNumber
    $scope.selectNumber = healthCache.length
    $scope.overflow = ($scope.selectNumber >= CONFIG.maxHealthNumber)
    cushion = ($scope.selectNumber >= CONFIG.maxHealthNumber)
    RefreshHealthRecords()
  })

  
  $scope.selectOrDeselect = function (itemId, selected) {
    $scope.hasChanged = true
    if (selected) {
      healthCache.push({time: itemId})
      ++$scope.selectNumber
    } else {
      // $scope.overflow = false
      for (var i = 0; i < healthCache.length; i++) {
        if (healthCache[i].time === itemId) {
          healthCache.splice(i, 1)
          --$scope.selectNumber
          break
        }
      }
    }
    $scope.overflow = ($scope.selectNumber >= CONFIG.maxHealthNumber)
    // console.log(healthCache)
    // 保存的时候才用
  }

  
  $scope.popAlert = function (selectNumber) {
    if (selectNumber >= CONFIG.maxHealthNumber) {
      if (cushion) {
        $ionicLoading.show({
          template: '最多只能选择' + CONFIG.maxHealthNumber  + '条健康信息！',
          duration: 1000,
          hideOnStateChange: true
        })
      }
      cushion = true
    } else {
      cushion = false
    }
  }

  $scope.SaveHealthList = function () {
    // console.log(123)
    Storage.set('consulthealthinfo', angular.toJson(healthCache))
    $ionicHistory.goBack()
  }

  $scope.do_refresher = function () {
    RefreshHealthRecords()
    $scope.$broadcast('scroll.refreshComplete')
  }

  $scope.gotoHealthDetail = function (editId) {
    $state.go('tab.myHealthInfoDetail', {id: editId, caneidt: false})
  }
}])

.controller('OrderCtrl', ['Service','$ionicPopup','Order','$scope', '$state', '$ionicLoading','$filter', function (Service,$ionicPopup,Order, $scope, $state, $ionicLoading,$filter) {
  var RefreshOrders = function(){
    Order.GetOrders().then(function(data){
      if(data.results!==null){
        $scope.myOrders = data.results
      }else{
        $scope.noOrder = true
      }
      
      console.log(data.results)
    },function(err){

    })
  }
  $scope.$on('$ionicView.enter', function () {
    RefreshOrders()
  })

  $scope.do_refresher = function () {
    RefreshOrders()
    $scope.$broadcast('scroll.refreshComplete')
  }
  $scope.cancelAppointment = function(DiagAppoint,doctorName){
    var morning = DiagAppoint.bookingTime === 'Morning'? '上午':'下午'
    $ionicPopup.confirm({
        title: '面诊取消提示',
        template: '预约医生：'+ doctorName + '，'+'</br>'+ '预约时间：' + $filter('date')(DiagAppoint.bookingDay, 'yyyy-MM-dd') +'日' + morning +'，'+'</br>' + '预约地点：' + DiagAppoint.place +'，'+'</br>' + '确认取消预约？',
        cancelText: '算了',
        okText: '确认'
    }).then(function(res){
      if(res){
        Service.cancelAppointment({diagId: DiagAppoint.diagId}).then(function(data){
          $ionicLoading.show({
            template:'预约已取消',
            duration:1500,
            hideOnStateChange:true
          })
          RefreshOrders()
        },function(err){

        })
      }
    })
  }
}])
