angular.module('kidney.controllers', ['ionic','kidney.services','ngResource','ionic-datepicker','kidney.directives'])//,'ngRoute'
//登录--PXY
.controller('SignInCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory','$http','Data','User','JM', '$location','wechat',function($scope, $timeout,$state,Storage,$ionicHistory,$http,Data,User,JM,$location,wechat) {
  $scope.barwidth="width:0%";
  // Storage.set("personalinfobackstate","logOn");
  // alert($location.absUrl())
  var temp = $location.absUrl().split('=')
  // alert(temp)
  // var code = temp[1].split('#')[0]
  // alert(code)
  // if (code != null )
  // {
  //   // alert(0)
  //   wechat.getUserInfo({code:code}).then(function(data){ 
  //     // alert(1)
  //     wechatData = data.results
  //     console.log(wechatData)
  //     alert(wechatData.openid)
  //     alert(wechatData.nickname)
  //   },function(err){
  //     console.log(err)
  //     // alert(2);
  //   })
  // }

  //-------------test测试-------------
    // $scope.test = function(){
    //    console.log("test for restful");
    //   User.updateAgree({userId:"U201703310032","agreement":0})
    // .then(
    //   function(data)
    //   {
    //     console.log('data');
    //     console.log(data);
    //   },
    //   function(err)
    //   {
    //     console.log('err');
    //     console.log(err);
    //   }
    // )
    // }




  //-----------测试结束------------
  
  if(Storage.get('USERNAME')!=null){
    $scope.logOn={username:Storage.get('USERNAME'),password:""};

  }else{
    $scope.logOn={username:"",password:""};
  }


  $scope.signIn = function(logOn) {  
    $scope.logStatus='';
    if((logOn.username!="") && (logOn.password!="")){
      var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
      //手机正则表达式验证
      if(!phoneReg.test(logOn.username)){
            $scope.logStatus="手机号验证失败！";
            return;
        }
      else{
            Storage.set('USERNAME',logOn.username);
            var logPromise = User.logIn({username:logOn.username,password:logOn.password,role:"patient"});
            logPromise.then(function(data){
                if(data.results==1){
                    if(data.mesg== "User doesn't Exist!"){
                        $scope.logStatus="账号不存在！";
                        return;
                    }
                    else if(data.mesg== "User password isn't correct!"){
                        $scope.logStatus = "账号或密码错误！";
                        return;
                    }
                }
                else if(data.results.mesg=="login success!"){
                    //jmessage login

                    JM.login(data.results.userId);

                    $scope.logStatus = "登录成功！";
                    $ionicHistory.clearCache();
                    $ionicHistory.clearHistory();
                    Storage.set('TOKEN',data.results.token);//token作用目前还不明确
                    Storage.set('isSignIn',"Yes");
                    Storage.set('UID',data.results.userId);
                    User.getAgree({userId:data.results.userId}).then(function(res){
                        if(res.results.agreement=="0"){
                            $timeout(function(){$state.go('tab.tasklist');},500);
                        }else{
                            $timeout(function(){$state.go('agreement',{last:'signin'});},500);
                        }
                    },function(err){
                        console.log(err);
                    })
                    

                }

            },function(err){
                if(err.results==null && err.status==0){
                    $scope.logStatus = "网络错误！";
                    return;
                }
                if(err.status==404){
                    $scope.logStatus = "连接服务器失败！";
                    return;
                }

            });
      }
      

    }
    else{
      $scope.logStatus="请输入完整信息！";
    }
  }

  
  $scope.toRegister = function(){
    
    $state.go('phonevalid',{phonevalidType:'register'});
   
  }
  $scope.toReset = function(){
    $state.go('phonevalid',{phonevalidType:'reset'});
  } 
  
}])

.controller('AgreeCtrl', ['$stateParams','$scope','$timeout','$state','Storage','$ionicHistory','$http','Data','User', function($stateParams,$scope, $timeout,$state,Storage,$ionicHistory,$http,Data,User) {
    $scope.YesIdo = function(){
        console.log('yesido');
        if($stateParams.last=='signin'){
            User.updateAgree({userId:Storage.get('UID'),agreement:"0"}).then(function(data){
                if(data.results!=null){
                    $timeout(function(){$state.go('tab.tasklist');},500);
                }else{
                    console.log("用户不存在!");
                }
            },function(err){
                console.log(err);
            })
        }
        else if($stateParams.last=='register'){
            $timeout(function(){$state.go('setpassword',{phonevalidType:'register'});},500);
        }
    }
}])


//手机号码验证--PXY
.controller('phonevalidCtrl', ['$scope','$state','$interval', '$stateParams','Storage','User','$timeout', function($scope, $state,$interval,$stateParams,Storage,User,$timeout) {
  $scope.barwidth="width:0%";
  // Storage.set("personalinfobackstate","register")
  
  $scope.Verify={Phone:"",Code:""};
  $scope.veritext="获取验证码";
  $scope.isable=false;
  var unablebutton = function(){      
     //验证码BUTTON效果
        $scope.isable=true;
        $scope.veritext="180S再次发送"; 
        var time = 179;
        var timer;
        timer = $interval(function(){
            if(time==0){
                $interval.cancel(timer);
                timer=undefined;        
                $scope.veritext="获取验证码";       
                $scope.isable=false;
            }else{
                $scope.veritext=time+"S再次发送";
                time--;
            }
        },1000);
  }
  //发送验证码
    var sendSMS = function(phone){
        var SMS = User.sendSMS({mobile:phone,smsType:1});
            SMS.then(function(data){
                unablebutton();
                if(data.mesg.substr(0,8)=="您的邀请码已发送"){
                    $scope.logStatus = "您的验证码已发送，重新获取请稍后";
                }else{
                    $scope.logStatus ="验证码发送成功！";
                }
            },function(err){
                if(err.results==null && err.status==0){
                    $scope.logStatus ="连接超时!";
                    return;
                }
                $scope.logStatus = "验证码发送失败！";

            });
    }

    // console.log($stateParams.phonevalidType);




    //点击获取验证码
    $scope.getcode=function(Verify){
        $scope.logStatus='';
    
        if (Verify.Phone=="") {
            $scope.logStatus="手机号码不能为空！";
            return;
        }
        var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
        //手机正则表达式验证
        if(!phoneReg.test(Verify.Phone)){
            $scope.logStatus="手机号验证失败！";
            return;
        }

        //如果为注册，注册过的用户不能获取验证码；如果为重置密码，没注册过的用户不能获取验证码
        if($stateParams.phonevalidType=='register'){
            User.getUserId({phoneNo:Verify.Phone}).then(function(data){
                if(data.results == 0){
                    $scope.logStatus = "该手机号码已经注册！";
                }else if(data.results == 1){
                    sendSMS(Verify.Phone);
                }
            },function(){
                $scope.logStatus="连接超时！";
            });
        }
        else if($stateParams.phonevalidType=='reset'){
            User.getUserId({phoneNo:Verify.Phone}).then(function(data){
                if(data.results == 1){
                    $scope.logStatus = "该账户不存在！";
                }else if(data.results == 0){
                    sendSMS(Verify.Phone);
                }
            },function(){
                $scope.logStatus="连接超时！";
            });
        }
    }

    //判断验证码和手机号是否正确
    $scope.gotoReset = function(Verify){

        $scope.logStatus = '';
        if(Verify.Phone!="" && Verify.Code!=""){
        //结果分为三种：(手机号验证失败)1验证成功；2验证码错误；3连接超时，验证失败
            var phoneReg=/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/;
            //手机正则表达式验证
            if(phoneReg.test(Verify.Phone)){ 
                //测试用
                if(Verify.Code==5566){
                    $scope.logStatus = "验证成功";
                    Storage.set('USERNAME',Verify.Phone);
                    if($stateParams.phonevalidType == 'register'){
                        $timeout(function(){$state.go('agreement',{last:'register'});},500);
                    }else{
                       $timeout(function(){$state.go('setpassword',{phonevalidType:$stateParams.phonevalidType});},500); 
                    }
                    
                }else{$scope.logStatus = "验证码错误";}
                // var verifyPromise =  User.verifySMS({mobile:Verify.Phone,smsType:1,smsCode:Verify.Code});
                // verifyPromise.then(function(data){
                //     if(data.results==0){
                //         $scope.logStatus = "验证成功";
                //         Storage.set('USERNAME',Verify.Phone);
                //         $timeout(function(){$state.go('setpassword',{phonevalidType:$stateParams.phonevalidType,phoneNumber:Verify.Phone});},500);
                //     }else{
                //         $scope.logStatus = data.mesg;
                //         return;
                //     }
                // },function(){
                //     $scope.logStatus = "连接超时！";
                // })
            }
            else{$scope.logStatus="手机号验证失败！";}
      
     
    
        
        }
        else{$scope.logStatus = "请输入完整信息！";}
  }

 
  
}])




//设置密码  --PXY 
.controller('setPasswordCtrl', ['$scope','$state','$rootScope' ,'$timeout' ,'Storage','$stateParams','User',function($scope,$state,$rootScope,$timeout,Storage,$stateParams,User) {
    $scope.barwidth="width:0%";
    $scope.BackMain = function(){
        $state.go('signin');
    }
    var setPassState=$stateParams.phonevalidType;
    if(setPassState=='reset'){
        $scope.headerText="重置密码";
        $scope.buttonText="确认修改";
    }else{
        $scope.headerText="设置密码";
        $scope.buttonText="下一步";
    }
    $scope.setPassword={newPass:"" , confirm:""};


    $scope.resetPassword=function(setPassword){
        $scope.logStatus='';
        if((setPassword.newPass!="") && (setPassword.confirm!="")){
            if(setPassword.newPass == setPassword.confirm){
                // var phone = $stateParams.phoneNumber;
                // console.log(phone);
                //如果是注册
                 if(setPassword.newPass.length<6){  ///^(\d+\w+[*/+]*){6,12}$/   1.输入的密码必须有数字和字母同时组成，可含特殊字符，6-12位； 
                    $scope.logStatus ="密码太短了！";

                }else{
                     if(setPassState=='register'){
                      //结果分为连接超时或者注册成功
                      $rootScope.password=setPassword.newPass;
                      Storage.set('PASSWORD',setPassword.newPass);
                      $state.go('userdetail',{last:'register'});
                      // var codePromise = User.register({phoneNo:phone,password:setPassword.newPass,role:"patient"});
                      // codePromise.then(function(data){
                      //     if(data.results==0){
                      //         Storage.set('USERNAME',phone);
                      //         $timeout(function(){$state.go('userdetail');} , 500);
                      //     }else{
                      //         $scope.logStatus = "该手机号码已经注册！";
                      //     }
                      // },function(){
                      //     $scope.logStatus = "连接超时！";
                      // })
                    }else if(setPassState == 'reset'){
                  //如果是重置密码
                  //结果分为连接超时或者修改成功
                      var codePromise = User.changePassword({phoneNo:Storage.get('USERNAME'),password:setPassword.newPass});
                      codePromise.then(function(data){
                          if(data.results==0){
                              Storage.set('USERNAME',phone);
                              $scope.logStatus ="重置密码成功！";
                              $timeout(function(){$state.go('signin');} , 500);
                          }else{
                              $scope.logStatus =  "该账户不存在！";
                          }
                          
                      },function(){
                          $scope.logStatus = "连接超时！";
                      })
                      
            
                  }
                }
               
            }else{
            $scope.logStatus="两次输入的密码不一致";
            }
        }else{
            $scope.logStatus="请输入两遍新密码";
        }
    }
}])


//个人信息--PXY
.controller('userdetailCtrl',['$http','$stateParams','$scope','$state','$ionicHistory','$timeout' ,'Storage', '$ionicPopup','$ionicLoading','$ionicPopover','Dict','Patient', 'VitalSign','$filter','Task','User',function($http,$stateParams,$scope,$state,$ionicHistory,$timeout,Storage, $ionicPopup,$ionicLoading, $ionicPopover,Dict,Patient, VitalSign,$filter,Task,User){
  $scope.barwidth="width:0%";
  //注册时可跳过个人信息
  // $scope.CanSkip = function(){
  //   if(Storage.get('setPasswordState')=='register'){
  //     return true;
  //   }
  //   else{
  //     return false;}
  // }

  // $scope.Skip = function(){
  //   $state.go('tab.tasklist');
  //   Storage.set('setPasswordState','sign');
  // }

    var back = $stateParams.last;
    console.log(back);


    $scope.CanBack = function(){
        if(back=='mine'){
          return true;
        }
        else{
          return false;}
      }


  $scope.Goback = function(){
        if($scope.canEdit==true){
            $scope.canEdit = false;
        }else{
            $ionicHistory.goBack();
        }
        
    }

  $scope.showProgress = false
  $scope.showSurgicalTime = false
  // var patientId = Storage.get('UID')
  // var patientId = "U201702080016"
  $scope.Genders =
  [
    {Name:"男",Type:1},
    {Name:"女",Type:2}
  ]

  $scope.BloodTypes =
  [
    {Name:"A型",Type:1},
    {Name:"B型",Type:2},
    {Name:"AB型",Type:3},
    {Name:"O型",Type:4}
  ]

  $scope.Hypers =
  [
    {Name:"是",Type:1},
    {Name:"否",Type:2}
  ]

  //从字典中搜索选中的对象。
  var searchObj = function(code,array){
      for (var i = 0; i < array.length; i++) {
        if(array[i].Type == code || array[i].type == code || array[i].code == code) return array[i];
      };
      return "未填写";
  }

  $scope.Diseases = ""
  $scope.DiseaseDetails = ""
  $scope.timename = ""
  $scope.getDiseaseDetail = function(Disease) {
    if (Disease.typeName == "肾移植")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "手术日期"
    }
    else if (Disease.typeName == "血透")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "插管日期"
    }
    else if (Disease.typeName == "腹透")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "开始日期"
    }
    else if (Disease.typeName == "ckd5期未透析")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = false
    }
    else
    {
      $scope.showProgress = true
      $scope.showSurgicalTime = false
      $scope.DiseaseDetails = Disease.details
    }
  }

  $scope.User = 
  {
    // "userId": null,
    // "name": null,
    // "gender": null,
    // "bloodType": null,
    // "hypertension": null,
    // "class": null,
    // "class_info": null,
    // "height": null,
    // "weight": null,
    // "birthday": null,
    // "IDNo": null,
    // "allergic":null,
    // "operationTime":null,
    // "lastVisit":{time:null,hospital:null,diagnosis:null},
    // // "lastVisit.hospital":null,
    // // "lastVisit.diagnosis":null
  }


  $scope.edit = function(){
        $scope.canEdit = true;
  }


  var initialPatient = function(){
        Patient.getPatientDetail({userId: Storage.get('UID')}).then(function(data){

                if (data.results != null){
                    console.log('执行查询');
                    console.log(data.results);
                    $scope.User =data.results;

                    // $scope.User.userId = data.results.userId
                    // $scope.User.name = data.results.name
                    // $scope.User.gender = data.results.gender
                    // $scope.User.bloodType = data.results.bloodType
                    // $scope.User.hypertension = data.results.hypertension
                    // $scope.User.class = data.results.class
                    // $scope.User.class_info = data.results.class_info
                    // $scope.User.height = data.results.height
                    // $scope.User.birthday = data.results.birthday
                    // $scope.User.IDNo = data.results.IDNo
                    // $scope.User.allergic = data.results.allergic||"无"

                    // $scope.User.operationTime = data.results.operationTime
                    // console.log($scope.User.lastVisit.time);
                    // $scope.User.lastVisit= data.results.lastVisit
                    // $scope.User.lastVisit.hospital = data.results.lastVisit.hospital
                    // $scope.User.lastVisit.diagnosis = data.results.lastVisit.diagnosis
                }
                if ($scope.User.gender != null){
                    $scope.User.gender = searchObj($scope.User.gender,$scope.Genders)
                }
                if ($scope.User.bloodType != null){
                    $scope.User.bloodType = searchObj($scope.User.bloodType,$scope.BloodTypes)
                }
                if ($scope.User.hypertension != null){
                    $scope.User.hypertension = searchObj($scope.User.hypertension,$scope.Hypers)
                }
                // if ($scope.User.birthday != null){
                //     $scope.User.birthday = $scope.User.birthday.substr(0,10)
                // }
                // if ($scope.User.operationTime != null){
                //     $scope.User.operationTime = $scope.User.operationTime.substr(0,10)
                // }
                // if ($scope.User.lastVisit.time != null){
                //     $scope.User.lastVisit.time = $scope.User.lastVisit.time.substr(0,10);
                // }
                VitalSign.getVitalSigns({userId:Storage.get('UID'), type: "Weight"}).then(function(data){
                    if(data.results){
                        var n = data.results.length - 1
                        var m = data.results[n].data.length - 1
                        if(data.results[n].data[m]){
                            $scope.User.weight = data.results[n].data[m] ? data.results[n].data[m].value:"";
                            // console.log($scope.BasicInfo)
                        }
                    }
                    
                    
                },function(err){
                        console.log(err);
                });
                Dict.getDiseaseType({category:'patient_class'}).then(function(data){
                    $scope.Diseases = data.results[0].content
                    $scope.Diseases.push($scope.Diseases[0])
                    $scope.Diseases.shift()
                    if ($scope.User.class != null){
                        $scope.User.class = searchObj($scope.User.class,$scope.Diseases)
                        if ($scope.User.class.typeName == "血透"){
                            $scope.showProgress = false
                            $scope.showSurgicalTime = true
                            $scope.timename = "插管日期"
                        }
                        else if ($scope.User.class.typeName == "肾移植"){
                            $scope.showProgress = false
                            $scope.showSurgicalTime = true
                            $scope.timename = "手术日期"
                        }
                        else if ($scope.User.class.typeName == "腹透"){
                            $scope.showProgress = false
                            $scope.showSurgicalTime = true
                            $scope.timename = "开始日期"
                        }
                        else if ($scope.User.class.typeName == "ckd5期未透析"){
                            $scope.showProgress = false
                            $scope.showSurgicalTime = false
                        }
                        else{
                            $scope.showProgress = true
                            $scope.showSurgicalTime = false
                            $scope.DiseaseDetails = $scope.User.class.details
                            $scope.User.class_info = searchObj($scope.User.class_info[0],$scope.DiseaseDetails)              
                        }
                    }
                        // console.log($scope.Diseases)
                },function(err){
                    console.log(err);
                });
                console.log($scope.User)
            },function(err){
                console.log(err);
          });
    }    


    if(back == 'register'){
        $scope.canEdit = true;
    
        Dict.getDiseaseType({category:'patient_class'}).then(function(data){
            $scope.Diseases = data.results[0].content
            $scope.Diseases.push($scope.Diseases[0])
            $scope.Diseases.shift()
            },function(err){
            console.log(err);
          });
    }else{
        $scope.canEdit = false;
        // patientId = Storage.get('UID');
        // var patientId = "U201702080016"
        initialPatient();
        

    }
  
   
 

  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  
  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject1.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.lastVisit.time=yyyy+'-'+m+'-'+d;
    }
  };
  
  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      DiagnosisdatePickerCallback(val);
    }
  };  
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject2.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.operationTime=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      OperationdatePickerCallback(val);
    }
  };  
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject3.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.User.birthday=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      BirthdatePickerCallback(val);
    }
  };  
  // --------datepicker设置结束----------------


   //////////////////////////////////////////////////////////////////////////
      // $scope.change = function(d)
      // {
      //   console.log(d);
      // }




     var MonthInterval = function(usertime){
        
        interval = new Date().getTime() - Date.parse(usertime);
        return(Math.floor(interval/(24*3600*1000*30)));
    }

    var distinctTask = function(kidneyType,kidneyTime,kidneyDetail){
        var sortNo = 1;
        console.log(kidneyType);
        console.log(kidneyDetail);
        // if(kidneyTime){
        //     kidneyTime = kidneyTime.substr(0,10);
        // }
        if(kidneyDetail){
            var kidneyDetail = kidneyDetail[0];
        }
        switch(kidneyType)
        {
            case "class_1":
                //肾移植
                if(kidneyTime!=undefined && kidneyTime!=null && kidneyTime!=""){
                    var month = MonthInterval(kidneyTime);
                    console.log("month"+month);
                    if(month>=0 && month<3){
                        sortNo = 1;//0-3月
                    }else if(month>=3 && month<6){
                        sortNo = 2; //3-6个月
                    }else if(month>=6 && month<36){
                        sortNo = 3; //6个月到3年
                    }else if(month>=36){
                        sortNo = 4;//对应肾移植大于3年
                    }

                }
                else{
                    sortNo = 4;
                }
                break;
            case "class_2": case "class_3"://慢性1-4期
                if(kidneyDetail!=undefined && kidneyDetail!=null && kidneyDetail!=""){
                    if(kidneyDetail=="stage_5"){//"疾病活跃期"
                        sortNo = 5;
                    }else if(kidneyDetail=="stage_6"){//"稳定期
                        sortNo = 6;
                    }else if(kidneyDetail == "stage_7"){//>3年
                        sortNo = 7;

                    }
                }
                else{
                    sortNo = 6;
                }
                break;
                
            case "class_4"://慢性5期
                sortNo = 8;
                break;
            case "class_5"://血透
                sortNo = 9;
                break;

            case "class_6"://腹透
                if(kidneyTime!=undefined && kidneyTime!=null && kidneyTime!=""){
                    var month = MonthInterval(kidneyTime);
                    console.log("month"+month);
                    if(month<6){
                        sortNo = 10;
                    }
                    else{
                        sortNo = 11;
                    }
                }
                break;


        }
        return sortNo;

    }
    $scope.infoSetup = function(){
    //console.log(User.Name);
     if ($scope.User.name&&$scope.User.gender&&$scope.User.class&&$scope.User.bloodType&&$scope.User.hypertension&&$scope.User.allergic&&$scope.User.birthday&&$scope.User.IDNo){
            //如果必填信息不为空
            // console.log("不为空");
            var IDreg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
            var PositiveReg = /^\d+(?=\.{0,1}\d+$|$)/;


            if ($scope.User.IDNo!='' && IDreg.test($scope.User.IDNo) == false){
                // console.log("身份证");
                $ionicLoading.show({
                template: '请输入正确的身份证号',
                duration:1000
                });
            }else if(($scope.User.height!=null && $scope.User.height!="" && PositiveReg.test($scope.User.height) == false )||($scope.User.weight!=null && $scope.User.weight!=""&&PositiveReg.test($scope.User.weight) == false) ){
                // console.log("身高体重");
                $ionicLoading.show({
                template: '请输入正确的身高体重',
                duration:1000
                });
            }
            else{
                if (back == 'register'){
                    $scope.User.gender = $scope.User.gender.Type;
                    $scope.User.bloodType = $scope.User.bloodType.Type;
                    $scope.User.hypertension = $scope.User.hypertension.Type;
                    if ($scope.User.class.typeName == "ckd5期未透析"){
                        $scope.User.class_info == null;
                    }
                    else if ($scope.User.class_info != null){
                        $scope.User.class_info = $scope.User.class_info.code;
                    }
                    $scope.User.class = $scope.User.class.type;

                    User.register({phoneNo:Storage.get('USERNAME'),password:Storage.get('PASSWORD'),role:"patient"}).then(function(data){
                        if(data.results==0){

                            var patientId = data.userNo;
                            Storage.set('UID',patientId);
                            //注册论坛

                            $http({
                                method  : 'POST',
                                url     : 'http://121.43.107.106:6699/member.php?mod=register&mobile=2&handlekey=registerform&inajax=1',
                                params    :{
                                    'regsubmit':'yes',
                                    'formhash':'',
                                    'D2T9s9':Storage.get('USERNAME'),
                                    'O9Wi2H':Storage.get('USERNAME'),
                                    'hWhtcM':Storage.get('USERNAME'),
                                    'qSMA7S':Storage.get('USERNAME')+'@qq.com'
                                },  // pass in data as strings
                                headers : {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Accept':'application/xml, text/xml, */*'
                                }  // set the headers so angular passing info as form data (not request payload)
                            }).success(function(data) {
                                // console.log(data);
                            });

                            User.updateAgree({userId:patientId,agreement:"0"}).then(function(data){
                                if(data.results!=null){
                                    $scope.User.userId = patientId;
                                    console.log($scope.User);
                                    Patient.newPatientDetail($scope.User).then(function(data){
                                        console.log("新建患者");
                                        console.log(data.results);
                                    

                                        var task = distinctTask(data.results.class,data.results.operationTime,data.results.class_info);
                                        Task.insertTask({userId:patientId,sortNo:task}).then(
                                            function(data){
                                                if(data.result=="插入成功"){
                                                    var now = new Date()
                                                    now =  $filter("date")(now, "yyyy-MM-dd HH:mm:ss")

                                                    VitalSign.insertVitalSign({patientId:patientId, type: "Weight",code: "Weight_1", date:now.substr(0,10),datatime:now,datavalue:$scope.User.weight,unit:"kg"}).then(function(data){
                                                        $scope.User.weight = data.results;
                                                        console.log($scope.User);
                                                        
                                                        $state.go('tab.tasklist');
                                                    },function(err){
                                                        $ionicLoading.show({
                                                            template: '注册失败',
                                                            duration:1000
                                                        });
                                                        console.log("插入体重"+err);
                                                    });
                                                    
                                                }
                                            },function(err){
                                                $ionicLoading.show({
                                                    template: '注册失败',
                                                            duration:1000
                                                });
                                                console.log("插入任务" + err);
                                            });
                                    },function(err){
                                        $ionicLoading.show({
                                            template: '注册失败',
                                            duration:1000
                                        });
                                        console.log("新建患者"+err);
                                    });  
                                }
                            },function(err){
                                console.log(err);

                            });
                                         
                        }else{
                            console.log("注册"+data.results);
                        }
                    },function(){
                        $ionicLoading.show({
                            template: '注册失败',
                            duration:1000
                        });
                        $scope.logStatus = "连接超时！";
                    });

                    
                    
                }else{//非注册用户
                    $scope.User.gender = $scope.User.gender.Type
                    $scope.User.bloodType = $scope.User.bloodType.Type
                    $scope.User.hypertension = $scope.User.hypertension.Type
                    if ($scope.User.class.typeName == "ckd5期未透析"){
                        $scope.User.class_info == null
                    }
                    else if ($scope.User.class_info != null){
                        $scope.User.class_info = $scope.User.class_info.code
                    }
                    $scope.User.class = $scope.User.class.type;
                    Patient.editPatientDetail($scope.User).then(function(data){
                        //保存成功
                        if(data.result=="修改成功"){
                            console.log(data.results);
                            var patientId = Storage.get('UID');
                            var task = distinctTask(data.results.class,data.results.operationTime,data.results.class_info);
                            Task.insertTask({userId:patientId,sortNo:task}).then(
                            function(data){
                                if(data.result=="插入成功"){
                                    var now = new Date()
                                    now =  $filter("date")(now, "yyyy-MM-dd HH:mm:ss")
                                    VitalSign.insertVitalSign({patientId:patientId, type: "Weight",code: "Weight_1", date:now.substr(0,10),datatime:now,datavalue:$scope.User.weight,unit:"kg"}).then(function(data){
                                        $scope.User.weight = data.results;
                                        console.log($scope.User);
                                        
                                        $scope.canEdit = false;
                                        initialPatient();
                                        
                                        
                                        // $state.go("tab.mine");
                                    },function(err){
                                        console.log(err);
                                    });
                                    
                                }
                            },function(err){
                                console.log("err" + err);
                            });
                        }
                        
                    },function(err){
                        console.log(err);
                    });
                    
                }
            }
        }else{
            $ionicLoading.show({
                template: '信息填写不完整,请完善必填信息(红色*)',
                duration:1000
            });
        }
    }


  
}])

//主页面--PXY
.controller('GoToMessageCtrl', ['$scope','$timeout','$state', '$location','wechat','$window','Patient',function($scope, $timeout,$state,$location,wechat,$window,Patient) {
  $scope.QRscan = function(){
    // alert(1)
    var config = "";
    wechat.settingConfig({url:$location.absUrl()}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['scanQRCode']
      // alert(config.jsApiList)
      // alert(config.debug)
      wx.config({
        debug:true,
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
                    var result = res.resultStr;
                    Patient.bindingMyDoctor({"patientId":Storage.get("UID"),"doctorId":result}).then(function(res){
                      if(res.result=="修改成功"){
                        $ionicPopup.alert({
                         title: '绑定成功！'
                        }).then(function(res) {
                          $state.go('tab.myDoctors');
                        });
                      }else if(res.result=="不存在的医生ID！"){
                        $ionicPopup.alert({
                         title: '不存在的医生ID！'
                        })
                      }
                   },function(){                    
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
  }
  $scope.GoToMessage = function(){
    $state.go('messages');
  }
  
  $scope.gotomine=function(){
    $state.go('tab.mine');
  }

  $scope.gotomyDoctors=function(){
    $state.go('tab.myDoctors')
  }

}])


  


//任务列表--GL
.controller('tasklistCtrl', ['$scope','$timeout','$state','$cordovaBarcodeScanner','Storage','$ionicHistory', '$ionicPopup', '$ionicModal', 'Compliance', '$window', 'Task','Patient', function($scope, $timeout,$state,$cordovaBarcodeScanner,Storage,$ionicHistory,$ionicPopup,$ionicModal,Compliance, $window, Task,Patient) {
  $scope.barwidth="width:0%";
  var UserId = Storage.get('UID');//U201511120002
  $scope.Tasks = {}; //任务

   $scope.$on('$ionicView.enter', function() {
        //GetDoneTask();
        ChangeLongFir();
  });  
  

  //获取对应任务模板
   function GetTask(TaskCode)
   { 
     console.log(1);
     var promise =  Task.getTask({userId:'Admin',sortNo:TaskCode[0]});
     promise.then(function(data){
       if(data.results.length != 0)
       {
          $scope.Tasks.Other = {};
          var AllTasks = data.results[0].task;          
          for(var i=0; i<AllTasks.length;i++)
          {
             if (AllTasks[i].type == 'Measure') //测量
             {
                $scope.Tasks.Measure = AllTasks[i].details;
                for(var j=0;j<$scope.Tasks.Measure.length;j++)
                {
                    $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);                    
                }
             }            
             else if(AllTasks[i].type == 'ReturnVisit') //复诊
             {
                $scope.Tasks.ReturnVisit = AllTasks[i].details[TaskCode[1]];
                $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
             }
             else if(AllTasks[i].type == 'LabTest') //化验
             {
                $scope.Tasks.LabTest = AllTasks[i].details[TaskCode[2]];
                $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
             }
             else if(AllTasks[i].type == 'SpecialEvaluate') //特殊评估
             {
                $scope.Tasks.SpecialEvaluate = AllTasks[i].details[0];                
                for(j=1;j< AllTasks[i].details.length;j++)
                {
                    $scope.Tasks.SpecialEvaluate.instruction += '，' + AllTasks[i].details[j].instruction;
                }
                $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);               
             }
             //console.log($scope.Tasks);            
          }         
       }
     },function(){
                    
     })
   }
  //任务暂且写死
  $scope.Tasks = [
        {
          "type": "Measure",
          "details": [
            {
              "code": "Temperature",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Weight",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "BloodPressure",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Vol",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "HeartRate",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            }
          ]
        },
        {
          "type": "ReturnVisit",
          "details": [            
            {
              "code": "TimeInterval_3",
              "instruction": "术后时间>3年",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "月"
            }
          ]
        },
        {
          "type": "LabTest",
          "details": [
            {
              "code": "LabTest_3",
              "instruction": "术后时间>3年",
              "content": "血常规、血生化、尿常规、尿生化、移植肾彩超、血药浓度",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "周"
            }
          ]
        },
        {
          "type": "SpecialEvaluate",
          "details": [
            {
              "code": "ECG",
              "instruction": "",
              "content": "心电图，胸片，移植肾B超",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "年"
            }            
          ]
        }
      ];
  function Temp()
  {
    $scope.Tasks.Other = [];
    for (var i=0;i<$scope.Tasks.length;i++)
    {
       var task = $scope.Tasks[i];
       if(task.type == 'Measure')
       {
          $scope.Tasks.Measure = task.details;
          for(var j=0;j<$scope.Tasks.Measure.length;j++)
          {
              $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);
              $scope.Tasks.Measure[j].Freq = $scope.Tasks.Measure[j].frequencyTimes + $scope.Tasks.Measure[j].frequencyUnits +$scope.Tasks.Measure[j].times + $scope.Tasks.Measure[j].timesUnits;
              $scope.Tasks.Measure[j].Flag = false;   
              $scope.Tasks.Measure[j].instruction = "";                
          }
       }
       else //复诊
       {
          var newTask = task.details[0];
          newTask.type = task.type;
          newTask.Name = NameMatch(newTask.type);
          newTask.Freq = newTask.frequencyTimes + newTask.frequencyUnits +newTask.times + newTask.timesUnits;
          newTask.Flag = false;
          newTask.instruction = "";
          $scope.Tasks.Other.push(newTask);                                
       }       
    }
    //console.log($scope.Tasks);
  }  
  //名称转换
   function NameMatch(name)
   {
     var Tbl = [
                 {Name:'体温', Code:'Temperature'},
                 {Name:'体重', Code:'Weight'},
                 {Name:'血压', Code:'BloodPressure'},
                 {Name:'尿量', Code:'Vol'},
                 {Name:'心率', Code:'HeartRate'},
                 {Name:'复诊', Code:'ReturnVisit'},
                 {Name:'化验', Code:'LabTest'},
                 {Name:'特殊评估', Code:'SpecialEvaluate'}
                ];
      for (var i=0;i<Tbl.length;i++)
      {
         if(Tbl[i].Code == name)
         {
            name = Tbl[i].Name
            break;
         }
      }
      return name;
   }
   
  //获取今日已执行任务
    function GetDoneTask()
    {               
         var nowDay = ChangeTimeForm(new Date());
         var promise1 = Compliance.getcompliance({userId:UserId, date:nowDay});
         promise1.then(function(data){
           if(data.results)
           {
              var doneTasks = data.results;  
              //console.log(doneTasks);                
              for(i=0;i< doneTasks.length;i++)
              {  
                  var Code = doneTasks[i].code;               
                  for (var j=0;j<$scope.Tasks.Measure.length;j++)
                  {
                     if($scope.Tasks.Measure[j].code == Code)
                     {                        
                        $scope.Tasks.Measure[j].Flag = true;
                        break;
                     }
                     else if($scope.Tasks.Other[j].code == Code)
                     {
                        $scope.Tasks.Other[j].Flag = true;
                        break;
                     }
                  }
              }                            
           }              
           //console.log(data.results);      
          
         },function(){
                        
         })
    }   

  //插入任务    
    function Postcompliance(task)
    {              
         var promise1 = Compliance.postcompliance(task);
         promise1.then(function(data){
           if(data.results)
           {
              //console.log(data.results);
              var Code = data.results.code;
              var time;
              for (var i=0;i<$scope.Tasks.Measure.length;i++)
              {
                if ($scope.Tasks.Measure[i].code == Code)
                {
                   $scope.Tasks.Measure[i].Flag = true;
                   time = SetNextTime($scope.Tasks.Measure[i].frequencyTimes, $scope.Tasks.Measure[i].frequencyUnits, $scope.Tasks.Measure[i].times);
                   //$scope.Tasks.Measure[i].Value = data.results.description;                 
                   break;
                }
              }
              for (var i=0;i<$scope.Tasks.Other.length;i++)
              {
                if ($scope.Tasks.Other[i].code == Code)
                {
                   $scope.Tasks.Other[i].Flag = true;
                   time = SetNextTime($scope.Tasks.Other[i].frequencyTimes, $scope.Tasks.Other[i].frequencyUnits, $scope.Tasks.Other[i].times);                   
                   break;
                }
              }
              //设定下次任务执行时间
              var timeStr = ChangeTimeForm(time);
              var item = {
                  userId:UserId,//unique
                  sortNo:1,
                  type:task.type,
                  code:task.code,
                  startTime:timeStr
               };
               ChangeTasktime(item);

           }                        
         },function(){                        
         });
    }
    
  //设定下次任务执行时间（长期任务）
    function SetNextTaskTime(Type, Addition)
    {      
      var Date1 = new Date(CurrentTime);
      var Date2;
      if(Type == "周") //周
      {
          Date2 = new Date(Date1.setDate(Date1.getDate() + Addition));
      }
      else if(Type == '月') //月
      {
          Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition));
      }
      else //年
      {
          Date2 = new Date(Date1.setMonth(Date1.getFullYear() + Addition));
      }    
      return Date2;
    }

  //修改任务执行时间
    function ChangeTasktime(task)
    {
      /*var promise = Task.changeTasktime(task);
       promise.then(function(data){
         //console.log(data);
         if(data.results)
         {
          console.log(data.results);
         };
       },function(){                    
       })*/
    }
    //ChangeTasktime();

  Temp();                        

  //修改长期任务第一次时间  
    function ChangeLongFir()
    {
        for (var i=0;i<$scope.Tasks.Other.length;i++)
        {
          if($scope.Tasks.Other[i].startTime == '2050-11-02T07:58:51.718Z') //未设定时间时
          {
            $scope.Tasks.Other[i].startTime = SetTaskTime($scope.Tasks.Other[i].frequencyUnits, $scope.Tasks.Other[i].times);
          }
        }
        //console.log($scope.Tasks.Other);
        /*for (var i=0;i<$scope.Tasks.Other.length;i++)
        {
          if($scope.Tasks.Other[i].startTime != '2050-11-02T07:58:51.718Z') //修改任务执行时间
          {
             var task = {
                userId:UserId,//unique
                sortNo:1,
                type:$scope.Tasks.Other[i].type,
                code:$scope.Tasks.Other[i].code,
                startTime:$scope.Tasks.Other[i].startTime
              };

              ChangeTasktime(task);
          }
        }*/
    }
  
  //设定长期任务第一次时间
   function SetTaskTime (Type, Times)
   {
      //暂时就用本地时间
      var CurrentDate = new Date();
      var NewDate;
      var WeekDay = CurrentDate.getDay(); //0-6 0为星期日
      var Day = CurrentDate.getDate(); //1-31
      var Month = CurrentDate.getMonth(); //0-11,0为1月
      
      var Num = 0;     
      if(Type == "周")
      {
         Num = 1;//默认周一

         if(Num >= WeekDay) //所选日期未过，选择本星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay));
         }
         else //下个星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay));
         }        
      }
      else if(Type == "月")
      {
         Num = 1; //默认1日
         NewDate = new Date(CurrentDate.setDate(Num));
         if (Num < Day) //所选日期已过，选择下月
         {
            NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
         }         
      }
      else if(Type == "年")
      {
         if(Times == 2) //一年2次 -- 6月1次
         {
            Num = 1;
            NewDate = new Date(CurrentDate.setDate(Num));
            if (Num < Day) //所选日期已过，选择下月
            {
              NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
            }  
         }
         else
         {
             Num = 0; //默认1月
             NewDate = new Date(CurrentDate.setMonth(Num));
             if(Num < Month)//所选日期已过，选择明年
             {
                NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1));
             }
             }
         
      }
      //console.log(ChangeTimeForm(NewDate));
      return ChangeTimeForm(NewDate);
   }

  //弹框格式
   var PopTemplate = {
                        Input:'<input type="text" ng-model="data.value">',
                        Textarea:'<textarea type="text" ng-model="data.value" rows="10" cols="100"></textarea>',
                        Select:'<select ng-model = "data.value"><option >请选择</option><option >是</option><option >否</option></select>'
                    };//Textarea：VascularAccess；
  
  //自定义弹窗
    $scope.showPopup = function(task, flag) {
      $scope.data = {};
      //console.log(task);
      var Template = PopTemplate.Input;
      var word = "";
      if(flag == 'textarea')
      {
          Template = PopTemplate.Textarea;
          word = "情况";
      }
      var myPopup = $ionicPopup.show({
         template: Template,     
         title: '请填写'+ task.Name + word,
         scope: $scope,
         buttons: [
           { text: '取消' },
           {
             text: '<b>保存</b>',
             type: 'button-positive',
             onTap: function(e) {
               if (!$scope.data.value) {
                 // 不允许用户关闭，除非输入内容
                 e.preventDefault();
               } else {
                return $scope.data.value;
               }  
               }    
           },
         ]
       });
       myPopup.then(function(res) {
        if(res)
        {
              for (var i=0;i<$scope.Tasks.Measure.length;i++)
              {
                if ($scope.Tasks.Measure[i].Name == task.Name)
                {
                   $scope.Tasks.Measure[i].instruction = res;
                   break;
                }
              }
              for (var i=0;i<$scope.Tasks.Other.length;i++)
              {
                if ($scope.Tasks.Other[i].Name == task.Name)
                {
                   $scope.Tasks.Other[i].instruction = res;
                   break;
                }
              }

          //向任务表中插入数据
          var item = {
                      "userId": UserId,
                      "type": task.type,
                      "code": task.code,
                      "date": ChangeTimeForm(new Date()),
                      "status": 0,
                      "description": res
                    };
          
          //console.log($scope.measureTask); 
          Postcompliance(item);
        }  
      });
    };
 
  //任务完成后设定下次任务执行时间,CurrentTime为整数
    function SetNextTime(FreqTimes, Unit, Times)
    {
        var NextTime;       
        if (Unit == "周")
        {
            NextTime = DateCalc("周",FreqTimes*7);
        }
        else if(Unit == "月")
        {
            NextTime = DateCalc("月", FreqTimes);
        }
        else //年
        {
            NextTime = DateCalc("年", FreqTimes);
            if((FreqTimes == 1)&&(Times == 2))
            {
              NextTime = DateCalc("月", 6);//1年2次转为6月1次
            }
        } 
        //console.log(NextTime);     
        return NextTime;
    }

  //日期延后计算
    function DateCalc(Type, Addition)
    {      
      var Date1 = new Date();
      var Date2;
      if(Type == "周") //周
      {
          Date2 = new Date(Date1.setDate(Date1.getDate() + Addition));
      }
      else if(Type == "月")
      {
          Date2 = new Date(Date1.setMonth(Date1.getMonth() + Addition));
      }
      else //年
      {
          Date2 = new Date(Date1.setYear(Date1.getFullYear() + Addition));
      }     
      return Date2;
    }
 
 //医生排班表数据
    $scope.Docweek = ["周一","周二","周三","周四","周五","周六","周日"];
    $scope.TblColor1 = ["gray", "green", "gray" ,"gray", "green", "green", "gray"];
    $scope.TblColor2 = ["gray", "green", "green" ,"green", "gray", "gray", "gray"];

 //弹窗：医生排班表
    $ionicModal.fromTemplateUrl('templates/modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
       }).then(function(modal) {
        $scope.modal = modal;
      });
       $scope.openModal = function() {
       $scope.modal.show();
     };
     $scope.closeModal = function() {
       $scope.modal.hide();
     };
     //清除
     $scope.$on('$destroy', function() {
       $scope.modal.remove();
     });  

 //修改日期格式Date → yyyy-mm-dd
   function ChangeTimeForm(date)
   {
      var mon = date.getMonth() + 1;
      var day = date.getDate();
      var nowDay = date.getFullYear() + "-" + (mon<10?"0"+mon:mon) + "-" +(day<10?"0"+day:day);
      return nowDay;
   }

//页面刷新
    $scope.Refresh = function()
    {
        //$window.location.reload();
    }
    //获取二维码信息
  $scope.scanbarcode = function () {
    $cordovaBarcodeScanner.scan().then(function(imageData) {
        // alert(imageData.text);
        Patient.bindingMyDoctor({"patientId":imageData.text,"doctorId":'doc01'}).then(function(res){
          //
          alert(imageData.text);
          alert(res.result);
       },function(){                    
       })
        console.log("Barcode Format -> " + imageData.format);
        console.log("Cancelled -> " + imageData.cancelled);
    }, function(error) {
        console.log("An error happened -> " + error);
    });
  };
}])

//任务设置--GL
.controller('TaskSetCtrl', ['$scope', '$state', '$ionicHistory', 'Storage', 'Patient', 'Task', function($scope, $state, $ionicHistory, Storage, Patient, Task) {
  var UserId = Storage.get('UID'); 
  var TmpMatchTbl = {};  //模板匹配表
  var DisaClass={}; //疾病进程 
  $scope.Tasks = {};
  $scope.$on('$ionicView.enter', function() {
        Temp();
  });  
  
  //获取患者任务模板
   function GetTask(TaskCode)
   { 
     var promise =  Task.getTask({userId:UserId});
     promise.then(function(data){
       if(data.results.length != 0)
       {          
          var AllTasks = data.results[0].task;          
          for(var i=0; i<AllTasks.length;i++)
          {
             if (AllTasks[i].type == 'Measure') //测量
             {
                $scope.Tasks.Measure = AllTasks[i].details;
                for(var j=0;j<$scope.Tasks.Measure.length;j++)
                {
                    $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);                    
                }
             }            
             else if(AllTasks[i].type == 'ReturnVisit') //复诊
             {
                $scope.Tasks.ReturnVisit = AllTasks[i].details[TaskCode[1]];
                $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
             }
             else if(AllTasks[i].type == 'LabTest') //化验
             {
                $scope.Tasks.LabTest = AllTasks[i].details[TaskCode[2]];
                $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
             }
             else if(AllTasks[i].type == 'SpecialEvaluate') //特殊评估
             {
                $scope.Tasks.SpecialEvaluate = AllTasks[i].details[0];                
                for(j=1;j< AllTasks[i].details.length;j++)
                {
                    $scope.Tasks.SpecialEvaluate.instruction += '，' + AllTasks[i].details[j].instruction;
                }
                $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);               
             }
             //console.log($scope.Tasks);            
          }         
       }
     },function(){
                    
     })
   }

  //任务先写死
  $scope.Tasks = [
        {
          "type": "Measure",
          "details": [
            {
              "code": "Temperature",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Weight",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "BloodPressure",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "Vol",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            },
            {
              "code": "HeartRate",
              "instruction": "",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 2,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "天"
            }
          ]
        },
        {
          "type": "ReturnVisit",
          "details": [            
            {
              "code": "TimeInterval_3",
              "instruction": "术后时间>3年",
              "content": "",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "月"
            }
          ]
        },
        {
          "type": "LabTest",
          "details": [
            {
              "code": "LabTest_3",
              "instruction": "术后时间>3年",
              "content": "血常规、血生化、尿常规、尿生化、移植肾彩超、血药浓度",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 2,
              "frequencyUnits": "周"
            }
          ]
        },
        {
          "type": "SpecialEvaluate",
          "details": [
            {
              "code": "ECG",
              "instruction": "",
              "content": "心电图，胸片，移植肾B超",
              "startTime": "2050-11-02T07:58:51.718Z",
              "endTime": "2050-11-02T07:58:51.718Z",
              "times": 1,
              "timesUnits": "次",
              "frequencyTimes": 1,
              "frequencyUnits": "年"
            }            
          ]
        }
      ];
  
  
  function Temp()
  {
    for (var i=0;i<$scope.Tasks.length;i++)
    {
       var task = $scope.Tasks[i];
       var temp;
       if(task.type == 'Measure')
       {
          $scope.Tasks.Measure = task.details;
          for(var j=0;j<$scope.Tasks.Measure.length;j++)
          {
              $scope.Tasks.Measure[j].Name = NameMatch($scope.Tasks.Measure[j].code);
              temp = $scope.Tasks.Measure[j];
              $scope.Tasks.Measure[j].Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;                    
          }
       }
       else if(task.type == 'ReturnVisit') //复诊
       {
          $scope.Tasks.ReturnVisit = task.details[0];
          temp = $scope.Tasks.ReturnVisit;
          $scope.Tasks.ReturnVisit.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.ReturnVisit = TimeSelectBind($scope.Tasks.ReturnVisit);                         
       }
       else if(task.type == 'LabTest') //化验
       {
          $scope.Tasks.LabTest =task.details[0];
          temp = $scope.Tasks.LabTest;
          $scope.Tasks.LabTest.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.LabTest = TimeSelectBind($scope.Tasks.LabTest);               
       }
       else if(task.type == 'SpecialEvaluate') //特殊评估
       {
          $scope.Tasks.SpecialEvaluate = task.details[0];  
          temp = $scope.Tasks.SpecialEvaluate;
          $scope.Tasks.SpecialEvaluate.Freq = temp.frequencyTimes + temp.frequencyUnits + temp.times + temp.timesUnits;    
          $scope.Tasks.SpecialEvaluate = TimeSelectBind($scope.Tasks.SpecialEvaluate);                
       }
    }
    //console.log($scope.Tasks);
  }
  
  //名称转换
   function NameMatch(name)
   {
     var Tbl = [
                 {Name:'体温', Code:'Temperature'},
                 {Name:'体重', Code:'Weight'},
                 {Name:'血压', Code:'BloodPressure'},
                 {Name:'尿量', Code:'Vol'},
                 {Name:'心率', Code:'HeartRate'},
                 {Name:'复诊', Code:'ReturnVisit'},
                 {Name:'化验', Code:'LabTest'},
                 {Name:'特殊评估', Code:'SpecialEvaluate'}
                ];
      for (var i=0;i<Tbl.length;i++)
      {
         if(Tbl[i].Code == name)
         {
            name = Tbl[i].Name
            break;
         }
      }
      return name;
   }

  //时间下拉框绑定
   function TimeSelectBind(item)
   {
        var Unit = item.frequencyUnits;
        if (Unit == "周")
        {
          item.Days = $scope.Week;
          item.Type = "week"; 
          item.SelectedDay = "星期一"; //默认时间
        }
        else if(Unit == "月")
        {
          item.Days = $scope.Days;
          item.Type = "month"; 
          item.SelectedDay = "1日";//默认时间
        }
        else if(Unit == '年')
        {
          item.Days = $scope.Month;
          item.Type = "year"; 
          item.SelectedDay = "1月";//默认时间
        }
        return item;     
   }

  //时间下拉框数据
   $scope.Week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
   $scope.Days = ["1日","2日","3日","4日","5日","6日","7日","8日","9日","10日","11日","12日","13日","14日","15日","16日","17日","18日","19日","20日","21日","22日","23日","24日","25日","26日","27日","28日"];
   $scope.Month = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  //页面跳转
   $scope.SetDate = function()
   {
     $scope.Tasks.ReturnVisit.startTime =  SetTaskTime($scope.Tasks.ReturnVisit. SelectedDay, $scope.Tasks.ReturnVisit.frequencyUnits);
     $scope.Tasks.LabTest.startTime =  SetTaskTime($scope.Tasks.LabTest. SelectedDay, $scope.Tasks.LabTest.frequencyUnits);
     $scope.Tasks.SpecialEvaluate.startTime =  SetTaskTime($scope.Tasks.SpecialEvaluate. SelectedDay, $scope.Tasks.SpecialEvaluate.frequencyUnits);
     //console.log($scope.Tasks);
      var Tasks = [                                      
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.ReturnVisit.type,
                        code:$scope.Tasks.ReturnVisit.code,
                        startTime:$scope.Tasks.ReturnVisit.startTime
                    },
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.LabTest.type,
                        code:$scope.Tasks.LabTest.code,
                        startTime:$scope.Tasks.LabTest.startTime
                    },
                    {
                        userId:UserId,//unique
                        sortNo:1,
                        type:$scope.Tasks.SpecialEvaluate.type,
                        code:$scope.Tasks.SpecialEvaluate.code,
                        startTime:$scope.Tasks.SpecialEvaluate.startTime
                    }
                 ];
     for (var i=0;i<Tasks.length;i++)
     {
        ChangeTasktime(Tasks[i]);
     }
     $ionicHistory.goBack();
   }

   $scope.Goback = function(){
     $ionicHistory.goBack();
   }
  
  //修改任务执行时间
    function ChangeTasktime(task)
    {     
     /* var promise = Task.changeTasktime(task);
       promise.then(function(data){
         //console.log(data);
         if(data.results)
         {
          console.log(data.results);
         };
       },function(){                    
       })*/
    }
    //ChangeTasktime();

  //选定星期或号数后，默认为离当前日期最近的日期
   function SetTaskTime (SelectedDay, Type)
   {
      //暂时就用本地时间
      var CurrentDate = new Date();
      var NewDate;
      var WeekDay = CurrentDate.getDay(); //0-6 0为星期日
      var Day = CurrentDate.getDate(); //1-31
      var Month = CurrentDate.getMonth(); //0-11,0为1月
      
      var Num = 0;     
      if(Type == "周")
      {
         Num = $scope.Week.indexOf(SelectedDay);

         if(Num >= WeekDay) //所选日期未过，选择本星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num - WeekDay));
         }
         else //下个星期
         {
            NewDate = new Date(CurrentDate.setDate(Day + Num + 7 - WeekDay));
         }        
      }
      else if(Type == "月")
      {
         Num = $scope.Days.indexOf(SelectedDay) + 1;
         NewDate = new Date(CurrentDate.setDate(Num));
         if (Num < Day) //所选日期已过，选择下月
         {
            NewDate = new Date(CurrentDate.setMonth(CurrentDate.getMonth() + 1));
         }         
      }
      else if(Type == "年")
      {
         Num = $scope.Month.indexOf(SelectedDay);
         NewDate = new Date(CurrentDate.setMonth(Num));
         if(Num < Month)//所选日期已过，选择明年
         {
            NewDate = new Date(CurrentDate.setYear(CurrentDate.getFullYear() + 1));
         }
      }
      //console.log(NewDate);
      return ChangeTimeForm(NewDate);
   }
 
   //编辑按钮
   $scope.EnableEdit = function ()
   {
      $('select').attr("disabled", false);
   }   

  //修改日期格式Date → yyyy-mm-dd
   function ChangeTimeForm(date)
   {
      var mon = date.getMonth() + 1;
      var day = date.getDate();
      var nowDay = date.getFullYear() + "-" + (mon<10?"0"+mon:mon) + "-" +(day<10?"0"+day:day);
      return nowDay;
   }

}])


//我的 页面--PXY
//我的 页面--PXY
.controller('MineCtrl', ['$scope','$ionicHistory','$state','$ionicPopup','$resource','Storage','CONFIG','$ionicLoading','$ionicPopover','Camera', 'Patient','Upload','wechat','$location',function($scope, $ionicHistory, $state, $ionicPopup, $resource, Storage, CONFIG, $ionicLoading, $ionicPopover, Camera,Patient,Upload,wechat,$location) {
  $scope.barwidth="width:0%";
  // Storage.set("personalinfobackstate","mine")
  
  var patientId = Storage.get('UID')
  //页面跳转---------------------------------
  $scope.GoUserDetail = function(){
    $state.go('userdetail',{last:'mine'});
  }
  $scope.GoConsultRecord = function(){
    $state.go('tab.myConsultRecord');
  }
  $scope.GoHealthInfo = function(){
    $state.go('tab.myHealthInfo');
  }
  $scope.GoManagement = function(){
    $state.go('tab.taskSet');
  }

  $scope.GoMoney = function(){
    $state.go('tab.myMoney');
  }

  $scope.SignOut = function(){
    var myPopup = $ionicPopup.show({
            template: '<center>确定要退出登录吗?</center>',
            title: '退出',
            //subTitle: '2',
            scope: $scope,
            buttons: [
              { text: '取消',
                type: 'button-small',
                onTap: function(e) {
                  
                }
              },
              {
                text: '<b>确定</b>',
                type: 'button-small button-positive ',
                onTap: function(e) {
                    $state.go('signin');
                    Storage.rm('TOKEN');
                    var USERNAME=Storage.get("USERNAME");
                    //Storage.clear();
                    Storage.set("IsSignIn","No");
                     Storage.set("USERNAME",USERNAME);
                     //$timeout(function () {
                     $ionicHistory.clearCache();
                     $ionicHistory.clearHistory();
                    //}, 30);
                    //$ionicPopup.hide();
                }
              }
            ]
          });

  }

  $scope.About = function(){
    $state.go('tab.about');
  }

  $scope.ChangePassword = function(){
    $state.go('tab.changePassword');
  }
  $scope.myAvatar = ""
  //根据用户ID查询用户头像
  Patient.getPatientDetail({userId:Storage.get("UID")}).then(function(res){
    console.log(Storage.get("UID"))
    // console.log(res.results)
    console.log(res.results.photoUrl)
    // console.log(angular.fromJson(res.results))
    if(res.results.photoUrl==undefined||res.results.photoUrl==""){
      $scope.myAvatar="img/DefaultAvatar.jpg"
    }else{
      $scope.myAvatar=res.results.photoUrl;
    }
  })
 
  // 上传头像的点击事件----------------------------
  $scope.onClickCamera = function($event){
    $scope.openPopover($event);
  };
  $scope.reload=function(){
    var t=$scope.myAvatar; 
    $scope.myAvatar=''

    $scope.$apply(function(){
      $scope.myAvatar=t;
    })

  }
 
 // 上传照片并将照片读入页面-------------------------
  var photo_upload_display = function(serverId){
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("UID") + "_" +  "myAvatar.jpg";
    console.log(temp_photoaddress)
    var temp_name = 'resized' + Storage.get("UID") + "_" +  "myAvatar.jpg";
    wechat.download({serverId:serverId, name:temp_name})
    .then(function(res){
      //res.path_resized
      //图片路径
      $scope.myAvatar="http://121.43.107.106:8052/uploads/photos/"+temp_name+'?'+new Date().getTime();
      console.log($scope.myAvatar)
      // $state.reload("tab.mine")
      Patient.editPatientDetail({userId:Storage.get("UID"),photoUrl:$scope.myAvatar}).then(function(r){
        console.log(r);
      })
    },function(err){
      console.log(err);
      reject(err);
    })
  };
  //-----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        //--------------------------------------------
        // .fromTemplateUrl() method
  $ionicPopover.fromTemplateUrl('my-popover.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(popover) {
    $scope.popover = popover;
  });
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

// 相册键的点击事件---------------------------------
  $scope.onClickCameraPhotos = function(){        
   // console.log("选个照片"); 
   $scope.choosePhotos();
   $scope.closePopover();
  };      
  $scope.choosePhotos = function() {
    var config = "";
    wechat.settingConfig({url:$location.absUrl()}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['chooseImage','uploadImage']
      // alert(config.jsApiList)
      // alert(config.debug)
      wx.config({
        debug:true,
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
    $scope.getPhoto = function() {
      // console.log("要拍照了！");
      $scope.takePicture();
      $scope.closePopover();
    };
    $scope.isShow=true;
    $scope.takePicture = function() {
      var config = "";
      wechat.settingConfig({url:$location.absUrl()}).then(function(data){
        // alert(data.results.timestamp)
        config = data.results;
        config.jsApiList = ['chooseImage','uploadImage']
        // alert(config.jsApiList)
        // alert(config.debug)
        wx.config({
          debug:true,
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


}])
//咨询记录--PXY
.controller('ConsultRecordCtrl', ['Patient','Storage','$scope','$timeout','$state','$ionicHistory','$ionicPopover','Counsels','$ionicPopup',function(Patient,Storage,$scope, $timeout,$state,$ionicHistory,$ionicPopover,Counsels,$ionicPopup) {
  $scope.barwidth="width:0%";

  $scope.Goback = function(){
    $state.go('tab.mine')
  }
  //根据患者ID查询其咨询记录,对response的长度加一定限制

    var patientID = Storage.get('UID');
    console.log(patientID)
    // var patientID = 'p01';


    //过滤重复的医生 顺序从后往前，保证最新的一次咨询不会被过滤掉
    var FilterDoctor = function(arr){
        var result =[];
        var hash ={};
        for(var i =arr.length-1; i>=0; i--){
            var elem = arr[i].doctorId.userId;
            if(!hash[elem]){
                result.push(arr[i]);
                hash[elem] = true;
            }
        }
        return result;
    }
    var promise = Patient.getCounselRecords({userId:patientID});
    promise.then(function(data){
        if(data.results!=""){

            FilteredDoctors = FilterDoctor(data.results);
            console.log(FilteredDoctors);


            items = new Array();
            console.log(FilteredDoctors);
            for(x in FilteredDoctors){
                var doctor = FilteredDoctors[x];
                console.log(doctor);

                var messages = doctor.messages;
                console.log("messages:" + messages);


                var res = "您已发起咨询，医生暂未回复，请稍后！";
                for(var i = messages.length-1;i>=0;i--){
                    if(messages[i].sender==doctor.doctorId.userId){
                        res = messages[i].content;
                    }
                }
                if(doctor.doctorId.photoUrl==""){
                    doctor.doctorId.photoUrl = "img/DefaultAvatar.jpg";
                }
                var consultTime = doctor.time;
                
                var item ={docId:doctor.doctorId.userId,img:doctor.doctorId.photoUrl,name:doctor.doctorId.name,time:consultTime,response:res};
                items.push(item);

            }
            $scope.items = items;

        }else{
            console.log('没有咨询记录');
        }
    },function(err){
        console.log(err);

    });
    
    $scope.getConsultRecordDetail = function(ele,doctorId) {
        if(ele.target.nodeName == "IMG"){
            $state.go("tab.DoctorDetail",{DoctorId:doctorId});
        }else{
            //查询是否有未完成的问诊
            Counsels.getStatus({doctorId:doctorId,patientId:Storage.get('UID'),type:2})
            .then(function(data)
            {
                console.log(data)
                // data.status=0
                if(data.status==0)//没有未结束的问诊，再看看有没有未结束的咨询
                {
                    //再看看有没有未结束的咨询
                    Counsels.getStatus({doctorId:doctorId,patientId:Storage.get('UID'),type:1})
                    .then(function(data)
                    {
                        console.log(data)
                        var template=""
                        if(data.status==0)//没有未结束的，直接进去吧，但要提示进去能看，发的话要收你钱的
                        {
                            template="您可以查看历史消息，但是发送消可能需要您支付一定费用"
                        }
                        else//还有未结束的，先让你进去看看
                        {
                            template="您将继续上次的咨询"
                        }
                        var question = $ionicPopup.confirm({
                            title:"问诊确认",
                            template:template,
                            okText:"确认",
                            cancelText:"取消"
                        });
                        question.then(function(res){
                            if(res){
                                $state.go("tab.consult-chat");
                            }
                        })
                    },function(err)
                    {
                        console.log(err)
                    })
                }
                else//还有未结束的，先让你进去看看
                {
                    var question = $ionicPopup.confirm({
                        title:"问诊确认",
                        template:"您将继续上次的问诊，医生结束前您可以提无限次问题！",
                        okText:"确认",
                        cancelText:"取消"
                    });
                    question.then(function(res){
                        if(res){
                            $state.go("tab.consult-chat");
                        }

                    })
                }
            },function(err)
            {
                console.log(err)
            })
        }
    
    };

  
}])


//聊天 XJZ 
.controller('ChatCtrl',['$scope', '$state', '$rootScope', '$ionicModal', '$ionicScrollDelegate', '$ionicHistory', 'Camera', 'voice','$http','CONFIG','Patient','Storage','wechat','$location','$q', function($scope, $state, $rootScope, $ionicModal, $ionicScrollDelegate, $ionicHistory, Camera, voice,$http,CONFIG,Patient,Storage,wechat,$location,$q) {
    $scope.input = {
        text: ''
    }
    
    // $scope.msgs = [];
    $scope.scrollHandle = $ionicScrollDelegate.$getByHandle('myContentScroll');
    function toBottom(animate,delay){
        if(!delay) delay=100;
        setTimeout(function(){
            $scope.scrollHandle.scrollBottom(animate);
        },delay)
    }
    //render msgs 
    $scope.$on('$ionicView.beforeEnter', function() {
        // $state.params.chatId='13709553333';
        $scope.msgs = [];
        $scope.params = {
            msgCount: 0,
            helpDivHeight: 60,
            hidePanel: true,
            moreMsgs:true,
            UID:Storage.get('UID')
        }
        // if($state.params.type=='0') $scope.params.hidePanel=false;
        // if (window.JMessage) {
        //     window.JMessage.enterSingleConversation($state.params.chatId, CONFIG.crossKey);
        //     getMsg(15);
        // }
        $scope.getMsg(15).then(function(data){$scope.msgs=data;});
        toBottom(true,2000);
    });
    $scope.$on('$ionicView.enter', function() {
        $rootScope.conversation.type = 'single';
        $rootScope.conversation.id = $state.params.chatId;
        Patient.getPatientDetail({ userId: $scope.params.UID })
        .then(function(response) {
            socket = io.connect('ws://121.43.107.106:4050/chat');
            socket.emit('newUser',{user_name:response.results.name,user_id:$scope.params.UID});
            socket.on('err',function(data){
                console.log(data)
                // $rootScope.$broadcast('receiveMessage',data);
            });
            socket.on('onlineCount',function(data){
                console.info('onlineCount');
                console.log(data);
                // $rootScope.$broadcast('receiveMessage',data);
            });
            socket.on('getMsg',function(data){
                console.info('getMsg');
                console.log(data);
                if (data.msg.targetType == 'single' && data.msg.fromName == $state.params.chatId) {
                    $scope.$apply(function(){
                        $scope.pushMsg(data.msg);
                    });
                }
                                // $rootScope.$broadcast('receiveMessage',data);
            });
            socket.on('messageRes',function(data){
                console.info('messageRes');
                console.log(data);
                if (data.msg.targetType == 'single' && data.msg.targetID == $state.params.chatId) {
                    setTimeout(function(){
                        $scope.$apply(function(){
                            $scope.pushMsg(data.msg);
                        });
                    },200)
                }
                // $rootScope.$broadcast('messageResponse',data);
            });

        }, function(err) {

        })
        imgModalInit();
    })
    // function msgsRender(first,last){
    //     while(first!=last){
    //         $scope.msgs[first+1].diff=($scope.msgs[first+1].createTimeInMillis-$scope.msgs[first].createTimeInMillis)>300000?true:false;
    //         first++;
    //     }
    // }

    $scope.getMsg = function(num) {
        console.info('getMsg');
        return $q(function(resolve,reject){
            var q={
                messageType:'1',
                id1:Storage.get('UID'),
                id2:$scope.params.chatId,
                skip:$scope.params.chatId,
                limit:num
            }
            Communication.getCommunication(q)
            .then(function(data){
                console.log(data);
                var d=data.results;
                $scope.$broadcast('scroll.refreshComplete');
                var res=[];
                for(var i in d){
                    res.push(d[i].content);
                }
                if(res.length==0) $scope.params.moreMsgs = false;
                else{
                    $scope.params.msgCount += res.length;
                    // $scope.$apply(function() {
                        if ($scope.msgs.length!=0) $scope.msgs[0].diff = ($scope.msgs[0].createTimeInMillis - res[0].createTimeInMillis) > 300000 ? true : false;
                        for (var i = 0; i < res.length - 1; ++i) {
                            if(res[i].contentType=='image') res[i].content.thumb=CONFIG.mediaUrl+res[i].content['src_thumb'];
                            res[i].direct = res[i].fromName==$scope.params.UID?'send':'receive';
                            res[i].diff = (res[i].createTimeInMillis - res[i + 1].createTimeInMillis) > 300000 ? true : false;
                            $scope.msgs.unshift(res[i]);
                        }
                        $scope.msgs.unshift(res[i]);
                        $scope.msgs[0].diff = true;
                    // });
                }
                console.log($scope.msgs);
                resolve($scope.msgs);
            },function(err){
                $scope.$broadcast('scroll.refreshComplete');
                resolve($scope.msgs);
            }); 
        })
        
    }

    //receiving new massage
    $scope.$on('receiveMessage', function(event, msg) {
        if (msg.targetType == 'single' && msg.fromName == $state.params.chatId) {
            viewUpdate(5);
        }
    });

    $scope.DisplayMore = function() {
        $scope.getMsg(15).then(function(data){
            $scope.msgs=data;
        });
    }


    //view image
    function imgModalInit(){
        $scope.zoomMin = 1;
        $scope.imageUrl = '';
        $scope.sound = {};
        $ionicModal.fromTemplateUrl('templates/msg/imageViewer.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
            // $scope.modal.show();
            $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
        });
    }
    // $scope.zoomMin = 1;
    // $scope.imageUrl = '';
    // $scope.sound = {};
    // $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/imageViewer.html', {
    //     scope: $scope
    // }).then(function(modal) {
    //     $scope.modal = modal;
    //     // $scope.modal.show();
    //     $scope.imageHandle = $ionicScrollDelegate.$getByHandle('imgScrollHandle');
    // });

    function onImageLoad(path) {
        $scope.$apply(function() {
            $scope.imageUrl = path;
        })

    }

    function onImageLoadFail(err) {

    }
    $scope.$on('image', function(event, args) {
        console.log(args)
        event.stopPropagation();
        $scope.imageHandle.zoomTo(1, true);
        $scope.imageUrl = CONFIG.mediaUrl + (args[2].src_thumb || args[2].localId_thumb);
        $scope.modal.show();
        // if (args[1] == 'img') {
            // window.JMessage.getOriginImageInSingleConversation($state.params.chatId, args[3], onImageLoad, onImageLoadFail);
        // } else {
            // getImage(url,onImageLoad,onImageLoadFail)
            // $scope.imageUrl = args[3];
        // }
    })
    $scope.closeModal = function() {
        $scope.imageHandle.zoomTo(1, true);
        $scope.modal.hide();
        // $scope.modal.remove()
    };
    $scope.switchZoomLevel = function() {
        if ($scope.imageHandle.getScrollPosition().zoom != $scope.zoomMin)
            $scope.imageHandle.zoomTo(1, true);
        else {
            $scope.imageHandle.zoomTo(5, true);
        }
    }
    $scope.$on('voice', function(event, args) {
        console.log(args)
        event.stopPropagation();
        $scope.params.audio=args[1];
        wx.downloadVoice({
            serverId: args[1].mediaId, // 需要下载的音频的服务器端ID，由uploadVoice接口获得
            isShowProgressTips: 0, // 默认为1，显示进度提示
            success: function (res) {
                // var localId = res.localId; // 返回音频的本地ID
                wx.playVoice({
                    localId: res.localId// 需要播放的音频的本地ID，由stopRecord接口获得
                });
            }
        });
    })
    $scope.$on('profile', function(event, args) {
            event.stopPropagation();
            $state.go('tab.DoctorDetail',{DoctorId:args[1]});
        })

    //病例Panel
    // $scope.togglePanel = function() {
    //     $scope.params.hidePanel = !$scope.params.hidePanel;
    // }
    $scope.content = {
        pics: [
            'img/avatar.png',
            'img/max.png',
            'img/mike.png'
        ]
    }
    $scope.viewPic = function(url) {
            $scope.imageHandle.zoomTo(1, true);
            $scope.imageUrl = url;
            $scope.modal.show();
        }
    // send message--------------------------------------------------------------------------------
        //
    $scope.updateMsg = function(msg){
        console.info('updateMsg');
        var pos=arrTool.indexOf($scope.msgs,'createTimeInMillis',msg.createTimeInMillis);
        if(pos!=-1){
            if(msg.contentType=='image') msg.content.thumb=CONFIG.mediaUrl+msg.content['src_thumb'];
            msg.diff=$scope.msgs[pos].diff;
            // $scope.$apply(function(){
                msg.direct = msg.fromName==$scope.params.UID?'send':'receive';
                $scope.msgs[pos]=msg;
            // });
            alert(JSON.stringify(msg));
        }
        // $scope.msgs=$scope.msgs;
    }
    $scope.pushMsg = function(msg){
        console.info('pushMsg');
        if($scope.msgs.length==0){
            msg.diff=true;
        }else{
            msg.diff=(msg.createTimeInMillis - $scope.msgs[$scope.msgs.length-1].createTimeInMillis) > 300000 ? true : false;
        }
        msg.direct = msg.fromName==$scope.params.UID?'send':'receive';
        if(msg.contentType=='image') {
            msg.content.thumb=CONFIG.mediaUrl+msg.content['src_thumb'];
            $http.get(msg.content.thumb).then(function(data){
                    $scope.msgs.push(msg);
            })
        }else{
            $scope.msgs.push(msg);
        }
    }
    function msgGen(content,type,local){
        var data={};
        if(type=='text'){
            data={
                text:content
            };
        }else if(type=='image'){
            data={
                mediaId:content[0],
                mediaId_thumb:content[1],
                src:'',
                src_thumb:''
            };
        }else if(type=='voice'){
            data={
                mediaId:content,
                src:''
            };
        }
        var msgJson={
            contentType:type,
            fromName:$scope.params.UID,
            fromUser:{
                avatarPath:''
            },
            targetID:$scope.params.chatId,
            targetName:'',
            targetType:'single',
            status:'send_going',
            createTimeInMillis: Date.now(),
            // _id:'',
            content:data
        }
        if(local){
            if(type=='image'){
                msgJson.content.localId=content[2];
                msgJson.content.localId_thumb=content[3];
            }else if(type=='voice'){
                msgJson.content.localId=content[1];
            }
        }
        return msgJson;
    }
    function sendmsg(content,type){
        var msgJson=msgGen(content,type);
        if(type=='text'){
            $scope.pushMsg(msgJson);
            // toBottom(true);
        }
        socket.emit('message',{msg:msgJson,to:$scope.params.chatId});
        toBottom(true);
    }
    function onSendSuccess(res) {
        viewUpdate(10);
    }

    function onSendErr(err) {
        console.log(err);
        alert('[send msg]:err');
        viewUpdate(10);
    }
    $scope.submitMsg = function() {
            window.JMessage.sendSingleTextMessage($state.params.chatId, $scope.input.text, CONFIG.crossKey,onSendSuccess, onSendErr);
            $scope.input.text = '';
            viewUpdate(5, true);
            // window.JMessage.getHistoryMessages("single",$state.params.chatId,"",0,3,addNewSend,null);
            
        }
        //get image
    $scope.getImage = function(type) {
         var ids=['',''];
        if(type=='cam') var st=['camera'];
        else var st = ['album'];
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: st, // 可以指定来源是相册还是相机，默认二者都有
            success: function (response) {
                console.log(response);
                ids=ids.concat(response.localIds);

                wx.uploadImage({
                    localId: response.localIds[0], // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 0, // 默认为1，显示进度提示
                    success: function (res) {
                        console.log(res);
                        ids[0]=res.serverId; // 返回图片的服务器端ID
                            sendmsg(ids,'image');
                    }
                });
            }
        });
    }
        //get voice
    $scope.getVoice = function(){
        wx.startRecord();
    }
    $scope.stopAndSend = function() {
        wx.stopRecord({
            success: function (res) {
                var ids=['',res.localId];
                var m=msgGen(ids,'voice',true);
                $scope.pushMsg(m);
                toBottom(true);
                wx.uploadVoice({
                    localId: res.localId, // 需要上传的图片的本地ID，由chooseImage接口获得
                    isShowProgressTips: 0, // 默认为1，显示进度提示
                    success: function (response) {
                        console.log(response);
                        ids[0]=response.serverId;
                        // var serverId = res.serverId; // 返回图片的服务器端ID
                        sendmsg(ids,'voice');
                    }
                });
            }
        });
    }

    $scope.goChats = function() {
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        $state.go('tab.myDoctors');
        // $ionicHistory.goBack();
    }


    $scope.$on('keyboardshow', function(event, height) {
        $scope.params.helpDivHeight = height + 60;
        setTimeout(function() {
            $scope.scrollHandle.scrollBottom();
        }, 100);

    })
    $scope.$on('keyboardhide', function(event) {
        socket.close();
        $scope.params.helpDivHeight = 60;
        // $ionicScrollDelegate.scrollBottom();
    })
    $scope.$on('$ionicView.leave', function() {
        $scope.msgs = [];
        if($scope.modal)$scope.modal.remove();
        $rootScope.conversation.type = null;
        $rootScope.conversation.id = '';
        if(window.JMessage) window.JMessage.exitConversation();
    })
}])



//健康信息--PXY
.controller('HealthInfoCtrl', ['$scope','$timeout','$state','$ionicHistory','$ionicPopup','HealthInfo','Storage','Health','Dict',function($scope, $timeout,$state,$ionicHistory,$ionicPopup,HealthInfo,Storage,Health,Dict) {
  $scope.barwidth="width:0%";
  var patientId = Storage.get('UID')

  $scope.Goback = function(){
    $state.go('tab.mine')
  }

  //从字典中搜索选中的对象。
  // var searchObj = function(code,array){
  //     for (var i = 0; i < array.length; i++) {
  //       if(array[i].Type == code || array[i].type == code || array[i].code == code) return array[i];
  //     };
  //     return "未填写";
  // }
  //console.log(HealthInfo.getall());

  $scope.items = []//HealthInfo.getall();
  

  Health.getAllHealths({userId:patientId}).then(
    function(data)
    {
      if (data.results != "" && data.results!= null)
      {
        $scope.items = data.results
        for (var i = 0; i < $scope.items.length; i++){
          $scope.items[i].acture = $scope.items[i].insertTime
          // $scope.items[i].time = $scope.items[i].time.substr(0,10)
          // if ($scope.items[i].url != ""&&$scope.items[i].url!=null)
          // {
          //   $scope.items[i].url = [$scope.items[i].url]
          // }
        }
      };
    },
    function(err)
    {
      console.log(err);
    }
  )


  $scope.gotoHealthDetail=function(ele,editId){
    console.log(ele)
    console.log(ele.target)
    if(ele.target.nodeName=="I"){
      var confirmPopup = $ionicPopup.confirm({
      title: '删除提示',
      template: '记录删除后将无法恢复，确认删除？',
      cancelText:'取消',
      okText:'删除'
      });

      confirmPopup.then(function(res) {
        if(res) 
          {
            Health.deleteHealth({userId:patientId,insertTime:editId.acture}).then(
              function(data)
              {
                if (data.results == 0)
                {
                  for (var i = 0; i < $scope.items.length; i++){
                    if (editId.acture == $scope.items[i].acture)
                    {
                      $scope.items.splice(i,1)
                      break;
                    }
                  }
                }
                
                console.log($scope.items)
              },
              function(err)
              {
                console.log(err);
              }
            )
            //20140421 zxf
            var healthinfotimes=angular.fromJson(Storage.get('consulthealthinfo'))
            for(var i=0;i<healthinfotimes.length;i++){
              if(healthinfotimes[i].time==editId.acture){
                healthinfotimes.splice(i, 1)
                break;
              }
            }
            Storage.set('consulthealthinfo',angular.toJson(healthinfotimes))
            // HealthInfo.remove(number);
            // $scope.items = HealthInfo.getall();
          } 
        });
    }else{
      $state.go('tab.myHealthInfoDetail',{id:editId});
    }
    
  }


  $scope.newHealth = function(){
    $state.go('tab.myHealthInfoDetail',{id:null});

  }

  // $scope.EditHealth = function(editId){
  //   console.log("健康信息");
  //   console.log(editId);
  //   $state.go('tab.myHealthInfoDetail',{id:editId});
  // }


  
}])


//健康详情--PXY
.controller('HealthDetailCtrl', ['$scope','$state','$ionicHistory','$ionicPopup','$stateParams','$ionicPopover','$ionicModal','$ionicScrollDelegate','HealthInfo','$ionicLoading','$timeout','Dict','Health','Storage','Camera','wechat','$location',function($scope, $state,$ionicHistory,$ionicPopup,$stateParams,$ionicPopover,$ionicModal,$ionicScrollDelegate,HealthInfo,$ionicLoading,$timeout,Dict,Health,Storage,Camera,wechat,$location) {
  $scope.barwidth="width:0%";
  var patientId = Storage.get('UID')

  

  $scope.Goback = function(){
        if($scope.canEdit==true){
            $scope.canEdit = false;
        }else{
            if($ionicHistory.backTitle()==null){
                $state.go('tab.myHealthInfo');
            }else{
                $ionicHistory.goBack();
            }
            console.log(123);
            console.log($ionicHistory.backTitle());
            
        }
        
    }

    $scope.edit = function(){
        $scope.canEdit = true;
        $scope.healthinfoimgurl = '';
        $ionicModal.fromTemplateUrl('partials/tabs/consult/msg/healthinfoimag.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            $scope.modal = modal;
          });
  }
  // $scope.$on('$ionicView.enter', function() {
    
  // })

    //从字典中搜索选中的对象。
  var searchObj = function(code,array){
    for (var i = 0; i < array.length; i++) {
      if(array[i].name == code) return array[i];
    };
    return "未填写";
  }

  // 获取标签类别
  $scope.labels = {}; // 初始化
    $scope.health={
    label:null,
    date:null,
    text:null,
    imgurl:null
  }
  $scope.health.imgurl=[]
  Dict.getHeathLabelInfo({category:"healthInfoType"}).then(
    function(data)
    {
      $scope.labels = data.results.details
      //判断是修改还是新增
      if($stateParams.id!=null && $stateParams!=""){
        //修改
        $scope.canEdit = false;
        var info = $stateParams.id;
        console.log(info)
        Health.getHealthDetail({userId:patientId,insertTime:info.acture}).then(
          function(data)
          {
            if (data.results != "" && data.results != null)
            {
              $scope.health.label = data.results.label
              if ($scope.health.label != null && $scope.health.label != "")
              {
                $scope.health.label = searchObj($scope.health.label,$scope.labels);
                console.log( $scope.health.label);
              }
              $scope.health.date = data.results.time
              $scope.health.text = data.results.description
              if (data.results.url != ""&&data.results.url!=null)
              {
                console.log(data.results.url)
                $scope.health.imgurl = data.results.url
                // $scope.showflag=true;
              }
            }
            console.log($scope.health);
          },
          function(err)
          {
            console.log(err);
          }
        )
      }else{
        $scope.canEdit = true;
      }
      console.log($scope.labels);
    },
    function(err)
    {
      console.log(err);
    }
  )
  //angular.toJson fromJson()
  //2017419 zxf
  // var testtt=[];
  // testtt.push("http://121.43.107.106:8052/uploads/photos/")
  // testtt.push("http://121.43.107.10da6:8052/uploads/photos/")
  // Storage.set('test',angular.toJson(testtt))
  // console.log(testtt)
  // console.log(Storage.get('test'))
  // console.log(angular.fromJson(Storage.get('test')))
  // testtt=angular.fromJson(Storage.get('test'))

// Storage.set('localhealthinfoimg',angular.toJson(testtt))
//进入之后local有数据但是不显示
  // $scope.health.imgurl=[];
  // var tmpimgurl=Storage.get('localhealthinfoimg');
  // console.log(tmpimgurl)
  // if(tmpimgurl!=""&&tmpimgurl!=null){
  //   console.log(tmpimgurl)
  //   $scope.health.imgurl=angular.fromJson(tmpimgurl);
  //   console.log($scope.health.imgurl)
  //   $scope.showflag=true;
  // }

  
  console.log($ionicHistory.backView())
  $scope.HealthInfoSetup = function(){
    if($scope.health.label!=""&&$scope.health.text!=""&&$scope.health.date!=""){
      console.log($stateParams.id)
        if($stateParams.id==null||$stateParams==""){
            Health.createHealth({userId:patientId,type:$scope.health.label.code,time:$scope.health.date,url:$scope.health.imgurl,label:$scope.health.label.name,description:$scope.health.text,comments:""}).then(
              function(data)
              {
                console.log(data.results);
                console.log(data.results.insertTime);
                $scope.canEdit= false;
                var healthinfoToconsult=[]
                //从咨询过来的需要返回对应的健康信息
                if($ionicHistory.backView()!=null&&$ionicHistory.backView().stateName=='tab.consultquestion2'){
                  if(Storage.get('consulthealthinfo')==''||Storage.get('consulthealthinfo')==null||Storage.get('consulthealthinfo')=='undefined'){
                    healthinfoToconsult.push({'time':data.results.insertTime})
                  }else{
                    healthinfoToconsult=angular.fromJson(Storage.get('consulthealthinfo'))
                    healthinfoToconsult.push({'time':data.results.insertTime})
                  }
                  Storage.set('consulthealthinfo',angular.toJson(healthinfoToconsult))
                  console.log(Storage.get('consulthealthinfo'))
                }


                $ionicHistory.goBack()
              },
              function(err)
              {
                console.log(err);
              }
            )
        }
        else{
            var curdate=new Date();
            Health.modifyHealth({userId:patientId,type:$scope.health.label.code,time:$scope.health.date,url:$scope.health.imgurl,label:$scope.health.label.name,description:$scope.health.text,comments:"",insertTime:$stateParams.id.insertTime}).then(
              function(data)
              {
                console.log(data.data);
                $scope.canEdit= false;
                // $ionicHistory.goBack()
              },
              function(err)
              {
                console.log(err);
              }
            )
        }
    }
    else{
        $ionicLoading.show({
            template:'信息填写不完整',
            duration:1000
        });
    }

}


  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  var datePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject4.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.health.date=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject4 = {
    titleLabel: '时间日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      datePickerCallback(val);
    }
  };  
//--------------copy from minectrl
  // 上传头像的点击事件----------------------------
  $scope.onClickCamera = function($event){
    $scope.openPopover($event);
  };
 
 // 上传照片并将照片读入页面-------------------------
  var photo_upload_display = function(serverId){
   // 给照片的名字加上时间戳
    var temp_photoaddress = Storage.get("UID") + "_" + new Date().getTime() + "healthinfo.jpg";
    console.log(temp_photoaddress)
    wechat.download({serverId:serverId,name:temp_photoaddress})
    .then(function(res){
      var data=angular.fromJson(res)
      //图片路径
      $scope.health.imgurl.push("http://121.43.107.106:8052/uploads/photos/"+temp_photoaddress)
      // $state.reload("tab.mine")
      // Storage.set('localhealthinfoimg',angular.toJson($scope.health.imgurl));
      console.log($scope.health.imgurl)
      // $scope.showflag=true;
    },function(err){
      console.log(err);
      reject(err);
    })
  };
//-----------------------上传头像---------------------
      // ionicPopover functions 弹出框的预定义
        //--------------------------------------------
        // .fromTemplateUrl() method
  $ionicPopover.fromTemplateUrl('my-popover1.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(popover) {
    $scope.popover = popover;
  });
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

  // 相册键的点击事件---------------------------------
  $scope.onClickCameraPhotos = function(){        
   // console.log("选个照片"); 
   $scope.choosePhotos();
   $scope.closePopover();
  };      
  $scope.choosePhotos = function() {
    var config = "";
    wechat.settingConfig({url:$location.absUrl()}).then(function(data){
      // alert(data.results.timestamp)
      config = data.results;
      config.jsApiList = ['chooseImage','uploadImage']
      // alert(config.jsApiList)
      // alert(config.debug)
      wx.config({
        debug:true,
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
  $scope.getPhoto = function() {
    // console.log("要拍照了！");
    $scope.takePicture();
    $scope.closePopover();
  };
  $scope.isShow=true;
  $scope.takePicture = function() {
      var config = "";
      wechat.settingConfig({url:$location.absUrl()}).then(function(data){
        // alert(data.results.timestamp)
        config = data.results;
        config.jsApiList = ['chooseImage','uploadImage']
        // alert(config.jsApiList)
        // alert(config.debug)
        wx.config({
          debug:true,
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



    $scope.openModal = function() {
      $scope.modal.show();
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });

  //点击图片返回
  $scope.imggoback = function(){
    $scope.modal.hide();
  };
  $scope.showoriginal=function(resizedpath){
    $scope.openModal();
    console.log(resizedpath)
    var originalfilepath="http://121.43.107.106:8052/uploads/photos/"+resizedpath.slice(resizedpath.lastIndexOf('/')+1).substr(7)
    console.log(originalfilepath)
    $scope.healthinfoimgurl=originalfilepath;
  }
  $scope.deleteimg=function(index){
    //somearray.removeByValue("tue");
    console.log($scope.health.imgurl)
    $scope.health.imgurl.splice(index, 1)
    // Storage.set('tempimgrul',angular.toJson($scope.images));
  }

  $scope.$on('$ionicView.leave', function() {
    $scope.modal.remove();
  })



  
}])




//增值服务--PXY
.controller('MoneyCtrl', ['$scope','$state','$ionicHistory','Account','Storage',function($scope, $state,$ionicHistory,Account,Storage) {
  $scope.barwidth="width:0%";
  var patientId = Storage.get('UID')
  $scope.Goback = function(){
    $state.go('tab.mine')
  }

  $scope.freeTimesRemain ="0";
  $scope.TimesRemain ="0";
  $scope.Balance = "0";
  //查询余额等等。。。。。
  Account.getAccountInfo({userId:patientId}).then(
    function(data)
    {
      if (data.results != "" && data.result != null)
      {
        $scope.freeTimesRemain = data.results.freeTimes
        $scope.TimesRemain = data.results.times
        $scope.Balance = data.results.money
      }
      
      // console.log($scope.BasicInfo)
    },
    function(err)
    {
      console.log(err);
    }
  )
}])



// //消息中心--PXY
  // .controller('messageCtrl', ['Message','Patient','Storage','$scope','$state','$ionicHistory', function(Message,Patient,Storage,$scope, $state,$ionicHistory) {
  //     $scope.barwidth="width:0%";
  //     $scope.haveMessage="";

  //     $scope.Goback = function(){
  //         $ionicHistory.goBack();
  //     } 

  //     $scope.getMessageDetail = function(type){
  //         $state.go('messagesDetail',{messageType:type});
  //     }

  //     $scope.getConsultRecordDetail = function(ele,doctorId) {
  //         if(ele.target.nodeName == "IMG"){
  //         $state.go("tab.DoctorDetail",{DoctorId:doctorId});
  //         }else{
  //         $state.go("tab.consult-chat");
  //         }
      
  //     };


  //   //只取每种类型消息的最新一条，由于原本顺序为降序排列，所以只要滤去重复的消息类型就好了
  //     var FilterType = function(arr){
  //         var result =[];
  //         var hash ={};
  //         for(var i =arr.length-1; i>=0; i--){
  //             var elem = arr[i].type;
  //             if(!hash[elem]){
  //                 result.push(arr[i]);
  //                 hash[elem] = true;
  //             }
  //         }
  //         return result;
  //     }
  //     // var user = "U201704120001";
  //     var user = Storage.get('UID');
  //     var messPromise = Message.getMessages({userId:user,type:""});
  //     messPromise.then(function(data){
  //         // console.log(data);
  //         if(data.results!=""){
  //             var filtered = FilterType(data.results);


  //             // console.log("filtered:"+filtered);
  //             var messages = new Array();
  //             for(x in filtered){
  //                 var photo = "",title = "";
  //                 switch(filtered[x].type){
  //                     case 1:
  //                         photo = "img/pay.PNG";
  //                         title = "支付消息";
  //                         break;
  //                     case 2:
  //                         photo = "img/alert.PNG";
  //                         title =  "警报消息";
  //                         break;
  //                     case 3:
  //                         photo = "img/task.PNG";
  //                         title = "任务消息";
  //                         break;

  //                 }
  //                 var item = {img:photo,name:title,type:filtered[x].type,time:filtered[x].time.substr(0,10),response:filtered[x].description};
  //                 messages.push(item);

  //             }
  //             $scope.messages = messages;
  //         }else{
  //             // $scope.messages = "您暂时没有收到消息！";
  //         }
          



  //     },function(err){
  //         console.log(err)
  //     });
  //   //根据患者ID查询其咨询记录,对response的长度加一定限制

  //     var patientID = Storage.get('UID');
  //     // var patientID = 'p01';


  //     //过滤重复的医生 顺序从后往前，保证最新的一次咨询不会被过滤掉
  //     var FilterDoctor = function(arr){
  //         var result =[];
  //         var hash ={};
  //         for(var i =arr.length-1; i>=0; i--){
  //             var elem = arr[i].doctorId.userId;
  //             if(!hash[elem]){
  //                 result.push(arr[i]);
  //                 hash[elem] = true;
  //             }
  //         }
  //         return result;
  //     }
  //     var promise = Patient.getCounselRecords({userId:patientID});
  //     promise.then(function(data){
  //         if(data.results!=""){

  //             FilteredDoctors = FilterDoctor(data.results);
  //             // console.log(FilteredDoctors);


  //             items = new Array();
  //             for(x in FilteredDoctors){
  //                 var doctor = FilteredDoctors[x];
  //                 // console.log(doctor);

  //                 var messages = doctor.messages;
  //                 // console.log("messages:" + messages);


  //                 var res = "您已发起咨询，医生暂未回复，请稍后！";
  //                 for(var i = messages.length-1;i>=0;i--){
  //                     if(messages[i].sender==doctor.doctorId.userId){
  //                         res = messages[i].content;
  //                     }
  //                 }
  //                 if(doctor.doctorId.photoUrl==""){
  //                     doctor.doctorId.photoUrl = "img/DefaultAvatar.jpg";
  //                 }
  //                 var consultTime = doctor.time.substr(0,10);
                  
  //                 var item ={docId:doctor.doctorId.userId,img:doctor.doctorId.photoUrl,name:doctor.doctorId.name,time:consultTime,response:res};
  //                 items.push(item);

  //             }
  //             $scope.consults = items;

  //         }else{
  //             console.log('没有咨询记录');
  //         }
  //     },function(err){
  //         console.log(err);

  //     });
// }])

//消息中心--PXY
.controller('messageCtrl', ['$scope','$state','$ionicHistory','Dict','Message','Storage',function($scope, $state,$ionicHistory,Dict,Message,Storage) {
    $scope.barwidth="width:0%";
    //get all message types
    Dict.typeOne({category:'MessageType'})
    .then(function(data)
    {
        // console.log(data.results.details)
        var messages={};
        angular.forEach(data.results.details,function(value,key)
        {
            // console.log(value)
            messages[value.inputCode]={name:value.name,code:value.code,values:[]};
        })
        // console.log(messages)
        Message.getMessages({userId:Storage.get('UID'),type:""})//Storage.get('UID')
        .then(function(data)
        {
            // console.log(data)
            angular.forEach(data.results,function(value,key)
            {
                // console.log(value)
                if(value.type==1)//支付消息
                {
                    messages.ZF.values.push(value)
                }
                else if(value.type==2)//警报消息
                {
                    messages.JB.values.push(value)
                }
                else if(value.type==3)//任务消息
                {   
                    messages.RW.values.push(value)
                }
                else if(value.type==4)//聊天消息
                {
                    messages.LT.values.push(value)
                }
                else if(value.type==5)//保险消息
                {
                    messages.BX.values.push(value)
                }
            })
            console.log(messages)
            Storage.set("allMessages",angular.toJson(messages));
            $scope.messages=messages;
        },function(err)
        {
            console.log(err)
        })
    },function(err)
    {
        console.log(err)
    })

    $scope.Goback = function(){
      $ionicHistory.goBack();
    }

    $scope.getMessageDetail = function(type){
        Storage.set("getMessageType",type);
        $state.go('messagesDetail');
    }
}])
//消息类型--PXY
.controller('VaryMessageCtrl', ['$scope','$state','$ionicHistory','Storage',function($scope, $state,$ionicHistory,Storage) {

    var messageType = Storage.get("getMessageType")
    $scope.messages=angular.fromJson(Storage.get("allMessages"))[messageType]
    console.log($scope.messages)

    if(messageType=='ZF')
        $scope.avatar='payment.png'
    else if(messageType=='JB')
        $scope.avatar='alert.png'
    else if(messageType=='RW')
        $scope.avatar='task.png'
    else if(messageType=='BX')
        $scope.avatar='security.png'

    $scope.Goback = function(){
        $ionicHistory.goBack();
    }

  
}])
// //消息类型--PXY
// .controller('VaryMessageCtrl', ['Message','Storage','$scope','$state','$ionicHistory','$stateParams',function(Message,Storage,$scope, $state,$ionicHistory,$stateParams) {
//     $scope.barwidth="width:0%";

//     var user = "U201704120001";
//     //var user = storage.get('UID');
//     var typedmess = Message.getMessages({userId:"U201704120001",type:$stateParams.messageType});
//     typedmess.then(function(data){
//         if(data.results!=""){
//             // console.log(data.results);

//             var letter = new Array();
//             for(x in data.results){
//                 var item = {time:data.results[x].time.substr(0,10),title:data.results[x].title,response:data.results[x].description};
//                 letter.push(item);
//             }
//             $scope.messages = letter;
//         }
//     },function(err){
//         console.log(err);
//     })



//     switch($stateParams.messageType){
//         case 1:
//         $scope.title = '支付消息';

//     // $scope.messages = [
//     // {
//     //     img:"img/pay.PNG",
//     //     time:"2017/04/01",
//     //     response:"恭喜你！成功充值50元，交易账号为0093842345."
//     // },
//     // {
//     //     img:"img/moneyout.PNG",
//     //     time:"2017/03/02",
//     //     response:"咨询支出20元，账户余额为10元，交易账号为0045252623."
//     // },
//     // {
//     //     img:"img/moneyout.PNG",
//     //     time:"2017/02/12",
//     //     response:"咨询支出20元，账户余额为30元，交易账号为004525212."
//     // },
//     // {
//     //     img:"img/pay.PNG",
//     //     time:"2017/02/02",
//     //     response:"恭喜你！成功充值50元，交易账号为0093840202."
//     // },
//     // {
//     //     img:"img/moneyout.PNG",
//     //     time:"2017/02/02",
//     //     response:"咨询支出10元，账户余额为0元，交易账号为0045250202."
//     // },
//     // {
//     //     img:"img/moneyout.PNG",
//     //     time:"2017/01/02",
//     //     response:"咨询支出10元，账户余额为10元，交易账号为0045250102."
//     // },
//     // {
//     //     img:"img/pay.PNG",
//     //     time:"2016/03/02",
//     //     response:"恭喜你！成功充值20元，交易账号为0093842356."
//     // },
//     // {
//     //     img:"img/pay.PNG",
//     //     time:"2016/01/02",
//     //     response:"恭喜你！成功充值20元，交易账号为009320163425."
//     // },
//     // {
//     //     img:"img/pay.PNG",
//     //     time:"2016/01/01",
//     //     response:"恭喜你！成功充值20元，交易账号为00325262423"
//     // }];
//         break;
//         case 3:
//         $scope.title = '任务消息';
//     // $scope.messages =[
  
//     // {
//     //     img:"img/bloodpressure.PNG",
//     //     time:"2017/03/21",
//     //     response:"今天还没有测量血压，请及时完成！"

//     // },
//     // {
//     //     img:"img/exercise.PNG",
//     //     time:"2017/03/11",
//     //     response:"今天建议运动半小时，建议以散步或慢跑的形式！"

//     // },
//     // {
//     //     img:"img/heartRoute.PNG",
//     //     time:"2017/02/10",
//     //     response:"今天还没有测量血管通路，请及时完成！"

//     // },
//     // {
//     //     img:"img/heartbeat.PNG",
//     //     time:"2017/01/11",
//     //     response:"今天还没有记录心率，请及时完成！"

//     // },
//     // {
//     //     img:"img/heartbeat.PNG",
//     //     time:"2017/01/01",
//     //     response:"今天还没有记录心率，请及时完成！"

//     // },
//     // {
//     //     img:"img/heartbeat.PNG",
//     //     time:"2016/10/01",
//     //     response:"今天还没有记录心率，请及时完成！"

//     // },
//     // {
//     //     img:"img/urine.PNG",
//     //     time:"2016/10/01",
//     //     response:"今天还没有记录尿量，请及时完成！"
//     // },
//     // {
//     //     img:"img/temperature.PNG",
//     //     time:"2016/10/01",
//     //     response:"今天还没有记录体温，请及时完成！"
//     // },
//     // {
//     //     img:"img/pounds.PNG",
//     //     time:"2016/10/01",
//     //     response:"今天还没有记录体重，请及时完成！"
//     // }

//     // ];
//         break;
//         case 2:
//         $scope.title = '警报消息';
//     // $scope.messages =[
  
//     // {
//     //     img:"img/bloodpressure.PNG",
//     //     time:"2017/03/11",
//     //     response:"你的血压值已超出控制范围！"

//     // },
//     // {
//     //     img:"img/bloodpressure.PNG",
//     //     time:"2017/03/07",
//     //     response:"你的血压值已超出控制范围！"

//     // },
//     // {
//     //     img:"img/pounds.PNG",
//     //     time:"2017/02/07",
//     //     response:"你的体重值已超出控制范围！"

//     // },
//     // {
//     //     img:"img/temperature.PNG",
//     //     time:"2017/01/07",
//     //     response:"你的体温值已超出控制范围！"

//     // },
//     // {
//     //     img:"img/temperature.PNG",
//     //     time:"2016/11/07",
//     //     response:"你的体温值已超出控制范围！"

//     // },
//     // {
//     //     img:"img/exercise.PNG",
//     //     time:"2016/10/07",
//     //     response:"你已经超过一周没进行运动！"

//     // },
//     // {
//     //     img:"img/heartbeat.PNG",
//     //     time:"2016/05/07",
//     //     response:"你的心率不太正常，建议及时就医！"

//     // },
//     // {
//     //     img:"img/pounds.PNG",
//     //     time:"2016/02/07",
//     //     response:"你的体重值已超出控制范围！"

//     // }

//     // ];
//         break;

//     }

//     $scope.Goback = function(){
//         $ionicHistory.goBack();
//     }

  
// }])
  
  
  



//医生列表--PXY
.controller('DoctorCtrl', ['Storage','$ionicLoading','$scope','$state','$ionicPopup','$ionicHistory','Dict','Patient','$location','Doctor',function(Storage,$ionicLoading,$scope, $state,$ionicPopup,$ionicHistory,Dict,Patient,$location,Doctor) {
  $scope.barwidth="width:0%";
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  //清空搜索框
  $scope.searchCont = {};

  $scope.clearSearch = function(){ 
    $scope.searchCont = {};  
    //清空之后获取所有医生 
    ChangeSearch();

  }  

 
    $scope.Provinces={};
    $scope.Cities={};
    $scope.Districts={};
    $scope.Hospitals={};

    $scope.doctors = [];
    $scope.doctor = "";
    $scope.moredata=true;

    var pagecontrol = {skip:0,limit:10};
    var alldoctors = new Array();



    $scope.loadMore=function(params){
          // $scope.$apply(function() {
        if(!params){
            params={province:"",city:"",district:"",hospital:"",name:""};
        }
        console.log(params);
         Patient.getDoctorLists({skip:pagecontrol.skip,limit:pagecontrol.limit,province:params.province,city:params.city,district:params.district,workUnit:params.hospital,name:params.name})
                  .then(function(data){
                    console.log(data.results);
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    
                    alldoctors=alldoctors.concat(data.results);
                    $scope.doctors=alldoctors;
                    if(alldoctors.length==0){
                        console.log("aaa")
                        $ionicLoading.show({ 
                            template: '没有医生', duration: 1000 
                        })
                    }
                    // $scope.nexturl=data.nexturl;
                     var skiploc=data.nexturl.indexOf('skip');
                    pagecontrol.skip=data.nexturl.substring(skiploc+5);
                    console.log(pagecontrol.skip);
                    if(data.results.length<pagecontrol.limit){$scope.moredata=false}else{$scope.moredata=true};
                  },function(err){
                      console.log(err);
                  })
          // });
       }


  // Patient.getDoctorLists().then(
  //     function(data)
  //     {
  //       $scope.doctors = data.results
  //       console.log($scope.doctors)
  //     },
  //     function(err)
  //     {
  //       console.log(err);
  //     }
  //   )
    var ChangeSearch = function(){
        pagecontrol = {skip:0,limit:10};
        alldoctors = new Array();
        console.log($scope.Province);
        var _province = ($scope.Province&&$scope.Province.province)? $scope.Province.province.name:"";
        var _city = ($scope.City&&$scope.City.city)? $scope.City.city.name:"";
        var _district = ($scope.District&&$scope.District.district)? $scope.District.district.name:"";
        console.log($scope.Hospital);
        var _hospital = ($scope.Hospital&&$scope.Hospital.hostipalCode)? $scope.Hospital.hostipalCode.hospitalName:"";
        var params = {province:_province,city:_city,district:_district,workUnit:_hospital,name:($scope.searchCont.t||"")};
        $scope.loadMore(params);
    }


    $scope.search = function(){
        // console.log("清空了");
        ChangeSearch();
    } 

    Dict.getDistrict({level:"1",province:"",city:"",district:""}).then(
      function(data)
      {
        $scope.Provinces = data.results;
        // $scope.Province.province = "";
        console.log($scope.Provinces)
      },
      function(err)
      {
        console.log(err);
      }
    )

  $scope.getCity = function (province) {
    // console.log($scope.Province)
    if(province!=null){
        Dict.getDistrict({level:"2",province:province.province,city:"",district:""}).then(
          function(data)
          {
            $scope.Cities = data.results;
            console.log($scope.Cities);
            
          },
          function(err)
          {
            console.log(err);
          }
        );
    }else{
        $scope.Cities = {};
        $scope.Districts ={};
        $scope.Hospitals = {};
    }
    ChangeSearch();
  }
  
  $scope.getDistrict = function (province,city) {
    console.log(province);
    if(city!=null){
        Dict.getDistrict({level:"3",province:city.province,city:city.city,district:""}).then(
      function(data)
      {
        $scope.Districts = data.results;
        console.log($scope.Districts);

        

        // var params = {province:province.name,city:city.name,district:"",hospital:"",name:($scope.searchCont.t||"")};
        // initialSearch();
        // $scope.loadMore(params);

        // Patient.getDoctorLists({province:province.name,city:city.name}).then(
        //     function(data){
        //         console.log(data.results);
        //         $scope.doctors = data.results;
        //     },function(err){
        //         console.log(err);
        //     })
        
      },
      function(err)
      {
        console.log(err);
      }
    );
    }else{
        $scope.Districts = {};
        $scope.Hospitals = {};
    }
    ChangeSearch();
  }

  $scope.getHospital = function (province,city,district) {
    // console.log(district.name);
    if(district!=null){
        var locationCode = district.province + district.city + district.district
    console.log(locationCode)
    Dict.getHospital({locationCode: locationCode,hostipalCode:""}).then(
      function(data)
      {
        $scope.Hospitals = data.results;
        console.log($scope.Hospitals);

        // var params = {province:province.name,city:city.name,district:district.name,hospital:"",name:($scope.searchCont.t||"")};
        // initialSearch();
        // $scope.loadMore(params);

        // Patient.getDoctorLists({province:province.name,city:city.name,district:district.name}).then(
        //     function(data){
        //         console.log(data.results);
        //         $scope.doctors = data.results;
        //     },function(err){
        //         console.log(err);
        //     })
      },
      function(err)
      {
        console.log(err);
      }
    )
    }else{
        $scope.Hospitals = {};
    }
        ChangeSearch();

    
  }
  
  $scope.getDoctorByHospital = function (province,city,district,hospital) {
        ChangeSearch();
        // if(hospital){
        //     var workUnit = hospital.hospitalName;
        // }else{
        //     var workUnit ="";
        // }
        // var params = {province:province.name,city:city.name,district:district.name,hospital:workUnit,name:($scope.searchCont.t||"")};

        // initialSearch();
        // $scope.loadMore(params);

    // Patient.getDoctorLists({workUnit: hospital.hospitalName}).then(
    //   function(data)
    //   {
    //     $scope.doctors = data.results
    //     console.log($scope.doctors)
    //   },
    //   function(err)
    //   {
    //     console.log(err);
    //   }
    // )
  }
  $scope.allDoctors = function(){
    $state.go('tab.AllDoctors');
  }


  $scope.getDoctorDetail = function(ele, id) {
    // var path = '#/tab/DoctorDetail/' + id;
    // console.log(path)
    // console.log(ele.target.nodeName);
    if(ele.target.nodeName =="IMG"){
        console.log(id);
      $state.go('tab.DoctorDetail',{DoctorId:id});
    }
    else if (ele.target.innerText == '咨询') {
        var question = $ionicPopup.confirm({
            title:"咨询确认",
            template:"进入咨询后，您有三次询问医生的次数。确认付费咨询？",
            okText:"确认",
            cancelText:"取消"
        });
        question.then(function(res){
            if(res){
                $state.go("tab.consultquestion1",{DoctorId:id,counselType:1});
            }

        })
    }
    else if (ele.target.innerText == '问诊'){
        var question = $ionicPopup.confirm({
            title:"问诊确认",
            template:"进入问诊后，当天您询问医生的次数不限。确认付费问诊？",
            okText:"确认",
            cancelText:"取消"
        });
        question.then(function(res){
            if(res){
                $state.go("tab.consultquestion1",{DoctorId:id,counselType:2});
            }

        })
    } 
    else $state.go('tab.DoctorDetail',{DoctorId:id})
    // else $location.path(path)
  }


   var RealDoctor = function(arr){
        var result =[];
        var hash ={};
        for(var i =arr.length-1; i>=0; i--){
            if(arr[i].invalidFlag==0){

            }
            var elem = arr[i].doctorId.userId;
            if(!hash[elem]){
                result.push(arr[i]);
                hash[elem] = true;
            }
        }
        return result;
    }


  
  //获取我的主管医生信息

  Patient.getMyDoctors({userId:Storage.get('UID')}).then(
    function(data){


        console.log(data.results.doctorId);
        if(data.results.doctorId==undefined){
          console.log(111)
          $scope.hasDoctor = false;
          if($ionicHistory.currentView().stateName=='tab.myDoctors'){
            $ionicLoading.show({ 
              template: '没有绑定的医生', duration: 1000 
          });
          }
          
        }
        else{
          $scope.hasDoctor = true;
          $scope.doctor = data.results.doctorId;
        }
        

    },function(err){
        console.log(err);
    })

  // Doctor.getDoctorInfo({userId:"U201702070041"}).then(
  //   function(data)
  //   {
  //     $scope.doctor = data.results
  //     console.log($scope.doctor)
  //   },
  //   function(err)
  //   {
  //     console.log(err)
  //   }
  // )
  // Patient.getMyDoctors({userId:"p01"}).then(
  //     function(data)
  //     {
  //       $scope.mydoctors = data.results.doctors
  //       console.log($scope.mydoctors)
  //     },
  //     function(err)
  //     {
  //       console.log(err);
  //     }
  //   )

  // $scope.question = function(){
  //   $state.go("tab.consultquestion1")
  // }

  // $scope.consult = function(){
  //   $state.go("tab.consultquestion1")
  // }


}])


.controller('DoctorDetailCtrl', ['$ionicPopup','$scope','$state','$ionicHistory','$stateParams','$stateParams','Doctor',function($ionicPopup,$scope, $state,$ionicHistory,$stateParams,$stateParams,Doctor) {
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  var DoctorId = $stateParams.DoctorId;
  console.log(DoctorId);

  $scope.doctor = "";
  Doctor.getDoctorInfo({userId:DoctorId}).then(
      function(data)
      {
        $scope.doctor = data.results
        console.log($scope.doctor)
      },
      function(err)
      {
        console.log(err);
      }
    )

   $scope.question = function(){
    var question = $ionicPopup.confirm({
            title:"咨询确认",
            template:"进入咨询后，您有三次询问医生的次数。确认付费咨询？",
            okText:"确认",
            cancelText:"取消"
        });
        question.then(function(res){
            if(res){
                $state.go("tab.consultquestion1");
            }

        });
  }

  $scope.consult = function(){
    var question = $ionicPopup.confirm({
            title:"问诊确认",
            template:"进入问诊后，当天您询问医生的次数不限。确认付费问诊？",
            okText:"确认",
            cancelText:"取消"
        });
        question.then(function(res){
            if(res){
                $state.go("tab.consultquestion1");
            }

        });
  }
}])


//关于--PXY
.controller('aboutCtrl', ['$scope','$timeout','$state','Storage','$ionicHistory', function($scope, $timeout,$state,Storage,$ionicHistory) {
   
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }
  
}])



//修改密码--PXY
.controller('changePasswordCtrl', ['$scope','$timeout','$state','$ionicPopup','Storage','$ionicHistory','User', function($scope, $timeout,$state,$ionicPopup,Storage,$ionicHistory,User) {
   
  $scope.Goback = function(){
    $ionicHistory.goBack();
  }

  $scope.ishide=true;
  $scope.change={oldPassword:"",newPassword:"",confirmPassword:""};


  $scope.passwordCheck = function(change){
    $scope.logStatus1='';
    if(change.oldPassword!=""){
        var username = Storage.get('USERNAME');
        User.logIn({username:username,password:$scope.change.oldPassword,role:'patient'})
        .then(function(succ)
        {
          console.log(succ)
          if(succ.mesg=="User password isn't correct!")
          {
            $scope.logStatus1='验证失败，密码错误！'
          }
          else
          {
            $scope.ishide=false;
          }
        },function(err)
        {
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
        
        
    }
    else{
      $scope.logStatus1='请输入旧密码！'
    }
    
  }

  $scope.gotoChange = function(change){
    $scope.logStatus2='';
    if((change.newPassword!="") && (change.confirmPassword!="")){
      if(change.newPassword == change.confirmPassword){
        if(change.newPassword.length<6){
            $scope.logStatus2 ="密码长度太短了！";
        }else{
             User.changePassword({phoneNo:Storage.get('USERNAME'),password:change.newPassword})
            .then(function(succ)
            {
              console.log(succ)
              if(succ.mesg=="password reset success!")
              {
                $ionicPopup.alert({
                 title: '修改密码成功！'
                }).then(function(res) {
                   $scope.logStatus2 ="修改密码成功！";
                  $state.go('tab.mine');
                });
              }
            },function(err)
            {
              console.log(err)
            })
        }
       

          // //把新用户和密码写入
          // var username = Storage.get('USERNAME');
          // var usernames = Storage.get('usernames').split(",");
          // var index = usernames.indexOf(username);
          // var passwords = Storage.get('passwords').split(",");
          // passwords[index] = change.newPassword;
         
          // Storage.set('passwords',passwords);
          // $scope.logStatus2 ="修改密码成功！";
          // $timeout(function(){$scope.change={originalPassword:"",newPassword:"",confirmPassword:""};
          // $state.go('tab.tasklist');
          // $scope.ishide=true;
          // } , 500);
      }else{
        $scope.logStatus2="两次输入的密码不一致";
      }
    }else{
      $scope.logStatus2="请输入两遍新密码"
    }
  }
  
}])

//肾病保险主页面--TDY
.controller('insuranceCtrl', ['$scope', '$state', '$ionicHistory',function ($scope, $state,$ionicHistory) {
  var show = false;

  $scope.isShown = function() {
        return show;
  };

  $scope.toggle = function() {
        show = !show;
  };

  $scope.intension = function(){
    $state.go("intension")
  }

  $scope.expense = function(){
    $state.go("insuranceexpense")
  }

  $scope.kidneyfunction = function(){
    $state.go("kidneyfunction")
  }

  $scope.staff = function(){
    $state.go("insurancestafflogin")
  }

  $scope.submitintension = function(){
    alert("您的信息已发送到后台，在24小时内会有相关人员与您联系")
  }

  $scope.cancel = function(){
    $state.go("insurance")
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }

  $scope.Back = function(){
    $ionicHistory.goBack()
  }
}])

//肾病保险相关工具--TDY
.controller('insurancefunctionCtrl', ['$scope', '$state', '$http', function ($scope, $state, $http) {
  $scope.InsuranceInfo = {
    "InsuranceAge": null,
    "Gender": "NotSelected",
    "InsuranceTime": "5年",
    "CalculationType": "CalculateMoney",
    "InsuranceMoney": null,
    "InsuranceExpense": 0,
    "InsuranceParameter": 0
  }

  $scope.Kidneyfunction = {
    "Gender": "NotSelected",
    "Age": null,
    "CreatinineUnit": "mg/dl",
    "Creatinine": null,
    "KidneyfunctionValue": 0
  }

  $scope.Genders = [
    {
      "Type": "NotSelected",
      "Name":"请选择",
      "No": 0
    },
    {
      "Type": "Male",
      "Name":"男",
      "No": 1
    },
    {
      "Type": "Female",
      "Name":"女",
      "No": 2
    }
  ]

  $scope.InsuranceTimes =[
    {
      "Time":"5年"
    },
    {
      "Time":"10年"
    }
  ]

  $scope.CalculationTypes = [
    {
      "Type": "CalculateMoney",
      "Name":"保费算保额",
      "No": 1
    },
    {
      "Type": "CalculateExpense",
      "Name":"保额算保费",
      "No": 2
    }
  ]

  $http.get("data/InsuranceParameter.json").success(function(data){
    dict = data
  })
  $scope.getexpense = function(){
    if ($scope.InsuranceInfo.InsuranceAge == null)
    {
      alert("请输入年龄")
    }
    if ($scope.InsuranceInfo.Gender == "NotSelected")
    {
      alert("请选择性别")
    }
    if ($scope.InsuranceInfo.InsuranceMoney == null)
    {
      alert("请输入金额")
    }
    for (var i=0;i<dict.length;i++){
      if (dict[i].Age == $scope.InsuranceInfo.InsuranceAge && dict[i].Gender == $scope.InsuranceInfo.Gender && dict[i].Time == $scope.InsuranceInfo.InsuranceTime)
      {
        $scope.InsuranceInfo.InsuranceParameter = dict[i].Parameter
        break
      }
    }
    if ($scope.InsuranceInfo.CalculationType == "CalculateMoney")
    {
      $scope.InsuranceInfo.InsuranceExpense = $scope.InsuranceInfo.InsuranceMoney*$scope.InsuranceInfo.InsuranceParameter/1000
      alert("您的保费为：" + $scope.InsuranceInfo.InsuranceExpense)
    }
    else if ($scope.InsuranceInfo.CalculationType == "CalculateExpense")
    {
      $scope.InsuranceInfo.InsuranceExpense = 1000*$scope.InsuranceInfo.InsuranceMoney/$scope.InsuranceInfo.InsuranceParameter
      alert("您的保额为：" + $scope.InsuranceInfo.InsuranceExpense)
    }
  }

  $scope.resetexpense = function(){
    $scope.InsuranceInfo = {
      "InsuranceAge": null,
      "Gender": "NotSelected",
      "InsuranceTime": "5年",
      "CalculationType": "CalculateMoney",
      "InsuranceMoney": null,
      "InsuranceExpense": 0
    }
  }

  $scope.getkidneyfunction = function(){
    if ($scope.Kidneyfunction.Age == null)
    {
      alert("请输入年龄")
    }
    if ($scope.Kidneyfunction.Creatinine == null)
    {
      alert("请输入肌酐")
    }
    if ($scope.Kidneyfunction.CreatinineUnit == "mg/dl" && $scope.Kidneyfunction.Gender == "Female")
    {
      if ($scope.Kidneyfunction.Creatinine <= 0.7)
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 144*Math.pow(($scope.Kidneyfunction.Creatinine/0.7),-0.329)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
      else
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 144*Math.pow(($scope.Kidneyfunction.Creatinine/0.7),-1.209)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
    }
    else if ($scope.Kidneyfunction.CreatinineUnit == "mg/dl" && $scope.Kidneyfunction.Gender == "Male")
    {
      if ($scope.Kidneyfunction.Creatinine <= 0.9)
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 141*Math.pow(($scope.Kidneyfunction.Creatinine/0.9),-0.411)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
      else
      {
        $scope.Kidneyfunction.KidneyfunctionValue = 141*Math.pow(($scope.Kidneyfunction.Creatinine/0.9),-1.209)*Math.pow(0.993,$scope.Kidneyfunction.Age)
      }
    }
    alert($scope.Kidneyfunction.KidneyfunctionValue)
  }

  $scope.resetkidneyfunction = function(){
    $scope.Kidneyfunction = {
      "Gender": "NotSelected",
      "Age": null,
      "CreatinineUnit": "mg/dl",
      "Creatinine": null,
      "KidneyfunctionValue": 0
    }
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }
}])

//肾病保险工作人员--TDY
.controller('insurancestaffCtrl', ['$scope', '$state', function ($scope, $state) {
  $scope.intensions = 
  [
    {
      "name": "李爱国",
      "phoneNo": "15688745215"
    },
    {
      "name": "张爱民",
      "phoneNo": "17866656326"
    },
    {
      "name": "步爱家",
      "phoneNo": "13854616548"
    }
  ]

  $scope.stafflogin = function(){
    $state.go("insurancestaff")
  }

  $scope.Goback = function(){
    $state.go("insurance")
  }

  $scope.Back = function(){
    $state.go("insurancestafflogin")
  }
}])
//咨询问卷--TDY
.controller('consultquestionCtrl', ['$scope', '$ionicPopup','$ionicModal','$state', 'Dict','Storage', 'Patient', 'VitalSign','$filter','$stateParams','$ionicPopover','Camera','Counsels','JM','CONFIG','Health',function ($scope,$ionicPopup, $ionicModal,$state,Dict,Storage,Patient,VitalSign,$filter,$stateParams,$ionicPopover,Camera,Counsels,JM,CONFIG,Health) {
  $scope.showProgress = false
  $scope.showSurgicalTime = false
  var patientId = Storage.get('UID')
  var DoctorId = $stateParams.DoctorId




  //20140421 zxf
  $scope.items = []//HealthInfo.getall();
  var healthinfotimes=[]
  if(Storage.get('consulthealthinfo')!=''&&Storage.get('consulthealthinfo')!='undefined'&&Storage.get('consulthealthinfo')!=null){
    healthinfotimes=angular.fromJson(Storage.get('consulthealthinfo'))
  }
  console.log(healthinfotimes)
  for(var i=0;i<healthinfotimes.length;i++){
    Health.getHealthDetail({userId:Storage.get('UID'),insertTime:healthinfotimes[i].time}).then(
          function(data)
          {
            if(data.results!=null){
              $scope.items.push(data.results)
              $scope.items[$scope.items.length-1].acture = $scope.items[$scope.items.length-1].insertTime
              // $scope.items[$scope.items.length-1].time = $scope.items[$scope.items.length-1].time.substr(0,10)
              // $scope.items.push({'label':data.results.label,'time':data.results.time.substr(0,10),'description':data.results.description,'insertTime':data.results.insertTime})
            }
          },
          function(err)
          {
            console.log(err);
          }
        )
  }

  //跳转修改健康信息
  $scope.gotoEditHealth=function(ele,editId){
    console.log(ele)
    console.log(ele.target)
    if(ele.target.nodeName=="I"){
      var confirmPopup = $ionicPopup.confirm({
      title: '删除提示',
      template: '记录删除后将无法恢复，确认删除？',
      cancelText:'取消',
      okText:'删除'
      });

      confirmPopup.then(function(res) {
        if(res) 
          {
            Health.deleteHealth({userId:patientId,insertTime:editId.acture}).then(
              function(data)
              {
                if (data.results == 0)
                {
                  for (var i = 0; i < $scope.items.length; i++){
                    if (editId.acture == $scope.items[i].acture)
                    {
                      $scope.items.splice(i,1)
                      break;
                    }
                  }
                }
                
                console.log($scope.items)
              },
              function(err)
              {
                console.log(err);
              }
            )
            //20140421 zxf
            var healthinfotimes=angular.fromJson(Storage.get('consulthealthinfo'))
            for(var i=0;i<healthinfotimes.length;i++){
              if(healthinfotimes[i].time==editId.acture){
                healthinfotimes.splice(i, 1)
                break;
              }
            }
            Storage.set('consulthealthinfo',angular.toJson(healthinfotimes))
            // HealthInfo.remove(number);
            // $scope.items = HealthInfo.getall();
          } 
        });
    }else{
      $state.go('tab.myHealthInfoDetail',{id:editId});
    }
    
  }

  console.log("Attention:"+DoctorId)
  // var patientId = "U201702080016"
  $scope.Genders =
  [
    {Name:"男",Type:1},
    {Name:"女",Type:2}
  ]

  $scope.BloodTypes =
  [
    {Name:"A型",Type:1},
    {Name:"B型",Type:2},
    {Name:"AB型",Type:3},
    {Name:"O型",Type:4}
  ]

  $scope.Hypers =
  [
    {Name:"是",Type:1},
    {Name:"否",Type:2}
  ]

  //从字典中搜索选中的对象。
  var searchObj = function(code,array){
      for (var i = 0; i < array.length; i++) {
        if(array[i].Type == code || array[i].type == code || array[i].code == code) return array[i];
      };
      return "未填写";
  }

  $scope.Diseases = ""
  $scope.DiseaseDetails = ""
  $scope.timename = ""
  $scope.getDiseaseDetail = function(Disease) {
    if (Disease.typeName == "肾移植")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "手术日期"
    }
    else if (Disease.typeName == "血透")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "插管日期"
    }
    else if (Disease.typeName == "腹透")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = true
      $scope.timename = "开始日期"
    }
    else if (Disease.typeName == "ckd5期未透析")
    {
      $scope.showProgress = false
      $scope.showSurgicalTime = false
    }
    else
    {
      $scope.showProgress = true
      $scope.showSurgicalTime = false
      $scope.DiseaseDetails = Disease.details
    }
  }
  var initialDict = function(){
    Dict.getDiseaseType({category:'patient_class'}).then(
      function(data)
      {
        $scope.Diseases = data.results[0].content
        $scope.Diseases.push($scope.Diseases[0])
        $scope.Diseases.shift()
        if ($scope.BasicInfo.class != null)
        {
          $scope.BasicInfo.class = searchObj($scope.BasicInfo.class,$scope.Diseases)
          if ($scope.BasicInfo.class.typeName == "血透")
          {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = "插管日期"
          }
          else if ($scope.BasicInfo.class.typeName == "肾移植")
          {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = "手术日期"
          }
          else if ($scope.BasicInfo.class.typeName == "腹透")
          {
            $scope.showProgress = false
            $scope.showSurgicalTime = true
            $scope.timename = "开始日期"
          }
          else if ($scope.BasicInfo.class.typeName == "ckd5期未透析")
          {
            $scope.showProgress = false
            $scope.showSurgicalTime = false
          }
          else
          {
            $scope.showProgress = true
            $scope.showSurgicalTime = false
            $scope.DiseaseDetails = $scope.BasicInfo.class.details
            $scope.BasicInfo.class_info = searchObj($scope.BasicInfo.class_info[0],$scope.DiseaseDetails)              
          }
        }
        // console.log($scope.Diseases)
      },
      function(err)
      {
        console.log(err);
      }
    )
    // Dict.getDiseaseType({category:'patient_class'}).then(
    //   function(data)
    //   {
    //     $scope.Diseases = data.results[0].content
    //     if ($scope.BasicInfo.class != null)
    //     {
    //       $scope.BasicInfo.class = searchObj($scope.BasicInfo.class,$scope.Diseases)
    //       if ($scope.BasicInfo.class.typeName == "血透")
    //       {
    //         $scope.showProgress = false
    //         $scope.showSurgicalTime = false
    //         $scope.BasicInfo.class_info == null
    //       }
    //       else if ($scope.BasicInfo.class.typeName == "肾移植")
    //       {
    //         $scope.showProgress = false
    //         $scope.showSurgicalTime = true
    //       }
    //       else
    //       {
    //         $scope.showProgress = true
    //         $scope.showSurgicalTime = false
    //         $scope.DiseaseDetails = $scope.BasicInfo.class.details
    //         $scope.BasicInfo.class_info = searchObj($scope.BasicInfo.class_info[0],$scope.DiseaseDetails)              
    //       }
    //     }
    //     console.log($scope.Diseases)
    //   },
    //   function(err)
    //   {
    //     console.log(err);
    //   }
    // )
  }
  $scope.BasicInfo = 
  {
    // "userId": patientId,
    // "name": null,
    // "gender": null,
    // "bloodType": null,
    // "hypertension": null,
    // "class": null,
    // "class_info": null,
    // "operationTime": null,
    // "allergic":null,
    // "height": null,
    // "weight": null,
    // "birthday": null,
    // "IDNo": null
  }
  // initialDict()
  Patient.getPatientDetail({userId: patientId}).then(
      function(data)
      {
        if (data.results != null)
        {
          $scope.BasicInfo = data.results
          // $scope.BasicInfo.name = data.results.name
          // $scope.BasicInfo.gender = data.results.gender
          // $scope.BasicInfo.bloodType = data.results.bloodType
          // $scope.BasicInfo.hypertension = data.results.hypertension
          // $scope.BasicInfo.class = data.results.class
          // $scope.BasicInfo.class_info = data.results.class_info
          // $scope.BasicInfo.height = data.results.height
          // $scope.BasicInfo.birthday = data.results.birthday
          // $scope.BasicInfo.IDNo = data.results.IDNo
          // $scope.BasicInfo.allergic = data.results.allergic||"无"

          // $scope.BasicInfo.operationTime = data.results.operationTime
        }
        if ($scope.BasicInfo.gender != null)
        {
          $scope.BasicInfo.gender = searchObj($scope.BasicInfo.gender,$scope.Genders)
        }
        if ($scope.BasicInfo.bloodType != null)
        {
          $scope.BasicInfo.bloodType = searchObj($scope.BasicInfo.bloodType,$scope.BloodTypes)
        }
        if ($scope.BasicInfo.hypertension != null)
        {
          $scope.BasicInfo.hypertension = searchObj($scope.BasicInfo.hypertension,$scope.Hypers)
        }
        // if ($scope.BasicInfo.birthday != null)
        // {
        //   $scope.BasicInfo.birthday = $scope.BasicInfo.birthday.substr(0,10)
        // }
        // if ($scope.BasicInfo.operationTime != null){
        //       $scope.BasicInfo.operationTime = $scope.BasicInfo.operationTime.substr(0,10)
        // }
        
        VitalSign.getVitalSigns({userId:patientId, type: "Weight"}).then(
          function(data)
          {
            var n = data.results.length - 1
            var m = data.results[n].data.length - 1
            $scope.BasicInfo.weight = data.results[n].data[m]?data.results[n].data[m].value:"";
            // console.log($scope.BasicInfo)
          },
          function(err)
          {
            console.log(err);
          }
        );
        initialDict();
        console.log($scope.BasicInfo)
      },
      function(err)
      {
        console.log(err);
      }
    )

  $scope.Questionare = {
    "LastDiseaseTime":"",
    "LastHospital":"",
    "LastVisitDate":"",
    "LastDiagnosis":"",
    "title":"",
    "help":""
  }
  if(Storage.get('consultcacheinfo')!=null&&Storage.get('consultcacheinfo')!=""&&Storage.get('consultcacheinfo')!='undefined'){
    $scope.Questionare=angular.fromJson(Storage.get('consultcacheinfo'))
  }
  // console.log(angular.toJson($scope.Questionare))
  if (Storage.get('tempquestionare') !== "" && Storage.get('tempquestionare') !== null)
  {
    $scope.Questionare = angular.fromJson(Storage.get('tempquestionare'))
  }
  console.log($scope.Questionare)
  // console.log(Storage.get('tempquestionare'))

  $scope.images = []
  if (Storage.get('tempimgrul') != "" && Storage.get('tempimgrul') != null)
  {
    $scope.images = angular.fromJson(Storage.get('tempimgrul'))
    //http://121.43.107.106:8052/uploads/photos/resized13735579254_1492596394430.jpg

  }
  //测试用 20170419 zxf
  // $scope.images.push("http://121.43.107.106:8052/uploads/photos/resized13735579254_1492596394430.jpg");
  // $scope.images.push("http://121.43.107.106:8052/uploads/photos/resized13735579254_1492593051359.jpg");
  // $scope.images.push("http://121.43.107.106:8052/uploads/photos/resized13735579254_1492592986223.jpg");
  

  console.log($scope.images)
  // --------datepicker设置----------------
  var  monthList=["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
  var weekDaysList=["日","一","二","三","四","五","六"];
  
  // --------诊断日期----------------
  var DiagnosisdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject1.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.Questionare.LastVisitDate=yyyy+'-'+m+'-'+d;
    }
  };
  
  $scope.datepickerObject1 = {
    titleLabel: '诊断日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      DiagnosisdatePickerCallback(val);
    }
  };  
  // --------手术日期----------------
  var OperationdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject2.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.BasicInfo.operationTime=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject2 = {
    titleLabel: '手术日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      OperationdatePickerCallback(val);
    }
  };  
  // --------出生日期----------------
  var BirthdatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject3.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.BasicInfo.birthday=yyyy+'-'+m+'-'+d;
    }
  };
  $scope.datepickerObject3 = {
    titleLabel: '出生日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1900, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      BirthdatePickerCallback(val);
    }
  };  
  // --------首次发病日期----------------
  var FirstDiseaseTimedatePickerCallback = function (val) {
    if (typeof(val) === 'undefined') {
      console.log('No date selected');
    } else {
      $scope.datepickerObject4.inputDate=val;
      var dd=val.getDate();
      var mm=val.getMonth()+1;
      var yyyy=val.getFullYear();
      var d=dd<10?('0'+String(dd)):String(dd);
      var m=mm<10?('0'+String(mm)):String(mm);
      //日期的存储格式和显示格式不一致
      $scope.Questionare.LastDiseaseTime=yyyy+'-'+m+'-'+d;
    }
  };
  
  $scope.datepickerObject4 = {
    titleLabel: '首次发病日期',  //Optional
    todayLabel: '今天',  //Optional
    closeLabel: '取消',  //Optional
    setLabel: '设置',  //Optional
    setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional
    inputDate: new Date(),    //Optional
    mondayFirst: false,    //Optional
    //disabledDates: disabledDates, //Optional
    weekDaysList: weekDaysList,   //Optional
    monthList: monthList, //Optional
    templateType: 'popup', //Optional
    showTodayButton: 'false', //Optional
    modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional
    from: new Date(1999, 1, 1),   //Optional
    to: new Date(),    //Optional
    callback: function (val) {    //Mandatory
      FirstDiseaseTimedatePickerCallback(val);
    }
  };  
  // --------datepicker设置结束----------------
  $scope.submit = function(){
    $scope.BasicInfo.gender = $scope.BasicInfo.gender.Type
    $scope.BasicInfo.bloodType = $scope.BasicInfo.bloodType.Type
    $scope.BasicInfo.hypertension = $scope.BasicInfo.hypertension.Type
    if ($scope.BasicInfo.class.typeName == "ckd5期未透析")
    {
      $scope.BasicInfo.class_info = null
    }
    else if ($scope.BasicInfo.class_info != null)
    {
      $scope.BasicInfo.class_info = $scope.BasicInfo.class_info.code
    }
    $scope.BasicInfo.class = $scope.BasicInfo.class.type
    var now = new Date()
    now =  $filter("date")(now, "yyyy-MM-dd HH:mm:ss")
    VitalSign.insertVitalSign({patientId:patientId, type: "Weight",code: "Weight_1", date:now.substr(0,10),datatime:now,datavalue:$scope.BasicInfo.weight,unit:"kg"}).then(
      function(data)
      {
        if(data.result == "修改成功" || data.result == "新建或修改成功")
        {
          $scope.BasicInfo.weight = data.results
          Patient.editPatientDetail($scope.BasicInfo).then(
            function(data)
            {
              if(data.result == "修改成功" || data.result == "新建或修改成功")
              {
                console.log(data.results)
                $state.go("tab.consultquestion2",{DoctorId:DoctorId})
              }
            },
            function(err)
            {
              console.log(err);
            }
          )
          console.log($scope.BasicInfo)
        }
        
      },
      function(err)
      {
        console.log(err);
      }
    )
  }
  
  $scope.SKip = function(){
    $state.go("tab.consultquestion2",{DoctorId:DoctorId})
  }

  $scope.backtoBasic = function(){
    $state.go("tab.consultquestion1",{DoctorId:DoctorId})
  }

  $scope.nexttoquestion = function(){
    Storage.set('tempquestionare',angular.toJson($scope.Questionare))
    Storage.set('tempimgrul',angular.toJson($scope.images))
    $state.go("tab.consultquestion3",{DoctorId:DoctorId})
  }

  $scope.backtoDisease = function(){
    Storage.set('tempquestionare',angular.toJson($scope.Questionare))
    $state.go("tab.consultquestion2",{DoctorId:DoctorId})
  } 

  $scope.Submitquestion = function(){
    // Storage.set('consultcacheinfo',angular.toJson([]));
    var temp = {
      "patientId":patientId,
      "doctorId":DoctorId, 
      "hospital":$scope.Questionare.LastHospital, 
      "visitDate":$scope.Questionare.LastVisitDate,
      "diagnosis":"", 
      "diagnosisPhotoUrl":$scope.images, 
      "sickTime":$scope.Questionare.LastDiseaseTime, 
      "symptom":$scope.Questionare.title, 
      "symptomPhotoUrl":$scope.images, 
      "help":$scope.Questionare.help
    }
    Counsels.questionaire(temp).then(
      function(data)
      {
        console.log(data);
        if (data.result == "新建成功")
        {
          Storage.rm('tempquestionare')
          Storage.rm('tempimgrul')
          // var msgdata={
          //   counsel:data.results,
          //   type:'card',
          //   patientId:patientId,
          //   patientName:$scope.BasicInfo.name,
          //   doctorId:DoctorId,
          //   fromId:patientId,
          //   targetId:DoctorId
          // }
            var msgJson={
                contentType:'custom',
                fromName:patientId,
                fromUser:{
                    avatarPath:''
                },
                targetID:DoctorId,
                targetName:'',
                targetType:'single',
                status:'send_going',
                createTimeInMillis: Date.now(),
                content:{
                    counsel:data.results,
                    type:'card',
                    patientId:patientId,
                    patientName:$scope.BasicInfo.name,
                    doctorId:DoctorId,
                    fromId:patientId,
                    targetId:DoctorId
                }
            }
          // temp.consultId=data.results.counselId;
          // temp.type='card';
            socket = io.connect('ws://121.43.107.106:4050/chat');
            socket.emit('newUser',{user_name:$scope.BasicInfo.name,user_id:patientId});
            socket.emit('message',{msg:msgJson,to:patientId});
            socket.close();

          
        }
        console.log(data.results)
      },
      function(err)
      {
        console.log(err);
      }
    )
  }

  //删除健康信息
  // $scope.DeleteHealth = function(item){
  // //console.log(number);
  //  //  confirm 对话框
  //   var confirmPopup = $ionicPopup.confirm({
  //     title: '删除提示',
  //     template: '记录删除后将无法恢复，确认删除？',
  //     cancelText:'取消',
  //     okText:'删除'
  //   });

  //   confirmPopup.then(function(res) {
  //     if(res) 
  //       {
  //         Health.deleteHealth({userId:patientId,insertTime:item.acture}).then(
  //           function(data)
  //           {
  //             if (data.results == 0)
  //             {
  //               for (var i = 0; i < $scope.items.length; i++){
  //                 if (item.acture == $scope.items[i].acture)
  //                 {
  //                   $scope.items.splice(i,1)
  //                   break;
  //                 }
  //               }
  //             }
              
  //             console.log($scope.items)
  //           },
  //           function(err)
  //           {
  //             console.log(err);
  //           }
  //         )
  //         //20140421 zxf
  //         var healthinfotimes=angular.fromJson(Storage.get('consulthealthinfo'))
  //         for(var i=0;i<healthinfotimes.length;i++){
  //           if(healthinfotimes[i].time==item.acture){
  //             healthinfotimes.splice(i, 1)
  //             break;
  //           }
  //         }
  //         Storage.set('consulthealthinfo',angular.toJson(healthinfotimes))
  //         // HealthInfo.remove(number);
  //         // $scope.items = HealthInfo.getall();
  //       } 
  //     });
  // }
  // $scope.Questionare = {
  //   "LastDiseaseTime":"",
  //   "LastHospital":"",
  //   "LastVisitDate":"",
  //   "LastDiagnosis":"",
  //   "title":"",
  //   "help":""
  // }
  // 上传头像的点击事件----------------------------
  $scope.addnewimage = function($event){
    Storage.set('consultcacheinfo',angular.toJson($scope.Questionare))
    $state.go('tab.myHealthInfoDetail')
    // $scope.openPopover($event);
  };
 


}])


//论坛
.controller('forumCtrl', ['$scope', '$state', '$sce','$http',function ($scope, $state,$sce,$http) {
  $scope.navigation=$sce.trustAsResourceUrl("http://121.43.107.106/");

  ionic.DomUtil.ready(function(){
        $http({
            method  : 'POST',
            url     : 'http://121.43.107.106/member.php?mod=logging&action=login&loginsubmit=yes&loginhash=$loginhash&mobile=2',
            params    : {'username':'admin','password':'bme319'},  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
            }).success(function(data) {
                //console.log(data);
        });
    })
}])

//写评论
.controller('SetCommentCtrl',['$scope', '$ionicHistory', '$ionicLoading','Storage','$state',
   function($scope, $ionicHistory,$ionicLoading,Storage,$state) {

      // //初始化
      $scope.comment={score:5, commentContent:""};
      

      $scope.nvGoback = function() {
        $ionicHistory.goBack();
       }
       
       //评论星星初始化
      $scope.ratingsObject = {
        iconOn: 'ion-ios-star',
        iconOff: 'ion-ios-star-outline',
        iconOnColor: '#FFD700',//rgb(200, 200, 100)
        iconOffColor: 'rgb(200, 100, 100)',
        rating: 5, 
        minRating: 1,
        readOnly:false,
        callback: function(rating) {
          $scope.ratingsCallback(rating);
        }
      };

      //评论星星点击改变分数
      $scope.ratingsCallback = function(rating) {
        $scope.comment.score = rating;
      };

      //上传评论-有效性验证
      $scope.deliverComment = function() {
        // if($scope.comment.selectedModoule=='')
        // {
        //   $ionicLoading.show({
        //       template: '请选择评价的模块',
        //       noBackdrop: false,
        //       duration: 1000,
        //       hideOnStateChange: true
        //     });
        // }
        if($scope.comment.commentContent.length <10)
        {
            $ionicLoading.show({
              template: '输入字数不足10字',
              noBackdrop: false,
              duration: 1000,
              hideOnStateChange: true
            });
        }
        
        else
        {
          SetComment();
        }
      };

      //上传评论-restful调用
     var SetComment= function()
     {

        var sendData={
          "DoctorId": Storage.get("HealthCoachID"),
          "CategoryCode": $scope.comment.selectedModoule,
          "Value": Storage.get("UID"),
          "Description": $scope.comment.commentContent,
          "SortNo": $scope.comment.score ,
          "piUserId": "sample string 6",
          "piTerminalName": "sample string 7",
          "piTerminalIP": "sample string 8",
          "piDeviceType": 9
        }
       var promise =  Users.SetComment(sendData); 
       promise.then(function(data){ 
          if(data.result=="数据插入成功"){
            $ionicLoading.show({
              template: "评论成功！",
              noBackdrop: false,
              duration: 500,
              hideOnStateChange: true
            });
            setTimeout(function(){
              $ionicHistory.goBack();
            },600);
          }
         },function(err) {   
       }); 
     } 
      
}])
.controller('paymentCtrl', ['$scope', '$state','$ionicHistory','Storage', function ($scope, $state,$ionicHistory,Storage) {
    $scope.Goback=function()
    {
        $ionicHistory.goBack();
    }
    $scope.payFor=Storage.get('payFor');//1->充咨询次数 2->充问诊
    // $scope.payFor=1
    $scope.money=50;
    $scope.pay=function(m)
    {
        if($scope.payFor==1)
        {
            if(m%50)
            {
                $scope.msg="无效的金额,"
                return;
            }
        }
        else
        {
            $scope.money=250;
        }
        //微信支付
    }
    console.log($scope.payFor)
}])