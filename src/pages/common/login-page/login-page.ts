import { Component } from '@angular/core';
import firebase from 'firebase';
import { NavController, LoadingController, NavParams } from 'ionic-angular';
import { AngularFire, AuthProviders, AuthMethods } from 'angularfire2'

import { UIDecider } from '../ui-decider/ui-decider'
@Component({
  selector: 'page-login-page',
  templateUrl: 'login-page.html'
})
export class LoginPage {

  activeForm: string = 'login'
  errors: any = []
  constructor(public navCtrl: NavController, public loadingCtrl: LoadingController, public navParams: NavParams, public af: AngularFire) {
    firebase.database.enableLogging(true);
    this.navCtrl.removeView(this.navCtrl.getPrevious());
  }

  ionViewDidEnter() {
    var views = this.navCtrl.getViews();
    views.forEach((k) => {
      console.log(k.component.name)
    });
  }

  login(email: string, password: string) {
    let loading = this.loadingCtrl.create({
      showBackdrop: false,
      spinner: 'crescent',
      content: 'Please wait, logging in...'
    });
    loading.present();
    this.errors = []
    this.af.auth.login({
      email, password
    }, {
        provider: AuthProviders.Password,
        method: AuthMethods.Password
      }).then((response) => {

        //Create localstorage
        firebase.database().ref('users/' + response.uid).once('value').then((snap) => {
          window.localStorage.setItem('userdetails', JSON.stringify({
            name: snap.val().name,
            role: snap.val().role,
            email: snap.val().email,
            uid: response.uid
          }))
          loading.dismissAll();
          this.navCtrl.push(UIDecider)
        });
      }).catch((error) => {
        loading.dismissAll()
        var errorCode = error['code'];
        var errorMessage = error['message'];
        if (errorCode === 'auth/wrong-password') {
          this.errors.push('wrong password');
        } else {
          this.errors.push(errorMessage)
        }
      });
  }

  signup(name: string, email: string, password: string) {
    this.errors = []
    name = name.trim();
    if (name.length < 2) {
      this.errors.push('Name must have more than 1 characters.')
    }
    if (password.length < 6) {
      this.errors.push('Password must have more than 5 chars.')
    }
    if (this.errors.length == 0) {
      let loading = this.loadingCtrl.create({
        showBackdrop: false,
        spinner: 'crescent',
        content: 'Creating your account, you may have to login again.'
      });
      loading.present();
      this.af.auth.createUser({
        email, password
      })
        .then((response) => {
          //Register user in database now.
          firebase.database().ref('users/' + response.uid).set({
            name: name,
            role: 'none',
            emai: email
          })
          //Create a cookie 
          window.localStorage.setItem('userdetails', JSON.stringify({
            name: name,
            role: 'none',
            email: email,
            uid: response.uid
          }))
          //Once both authentication and adding role = none is successful navigate to new page.
          loading.dismissAll();
          this.navCtrl.push(UIDecider)
        }).catch((error) => {
          var errorMessage = error['message'];
          this.errors.push(errorMessage)
        });
    }

  }

  forgot(email: string) {
    this.errors = []
    //https://aegis-test-cc70c.firebaseio.com
    firebase.auth().sendPasswordResetEmail(email)
      .then((response) => {
        alert('Check your email for reset link.')
      }).catch((error) => {
        var errorMessage = error['message'];
        this.errors.push(errorMessage)
      });
  }

  //switch form display 
  showForm(formName: string) {
    switch (formName) {
      case "login":
        this.activeForm = 'login';
        // console.log('login clicked')
        break;
      case "forgot":
        // console.log('forgot clicked')
        this.activeForm = 'forgot';
        break;
      case "signup":
        // console.log('signup clicked')
        this.activeForm = 'signup';
        break;
    }
  }

}
