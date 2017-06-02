import { LoginPage } from './../login-page/login-page';
import { ManagerJobProgressPage } from './../../manager/job-progress-page/job-progress-page';
import { UserHelper } from './../../common/Utilities/user-helper';
import { User } from './../../common/Model/User';
import { Job } from './../../common/Model/Job';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { AngularFire } from 'angularfire2'
import firebase from 'firebase'
import { JobDetailsPage } from '../../common/job-details-page/job-details-page'


@Component({
  templateUrl: 'current-jobs-page.html',
})
export class CurrentJobsPage {
  currentJobs: Job[] = []
  ref: any
  cUser: User
  constructor(public navCtrl: NavController, public navParams: NavParams,
    public af: AngularFire, public toastCtrl: ToastController, public alertCtrl: AlertController) {
    this.cUser = UserHelper.getCurrentUser()
    firebase.database().ref('requests').limitToLast(10).on('value', snap => {
      this.currentJobs = []
      if (snap.val()) {
        Object.keys(snap.val()).forEach(key => {
          var job: Job = new Job();
          Object.assign(job, snap.val()[key])
          if (this.cUser.hasAccessToJob(job)) {
            this.currentJobs.push(job)
          }
        })
      }
      this.currentJobs = this.currentJobs.reverse()
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ManagerCurrentJobsPage');
  }
  ionViewCanLeave() {
    this.ref = null;
  }

  setApprove(key) {
    firebase.database().ref('request/' + key + '/progress/').update({
      aegisApproved: { status: true, timestamp: this.getCurrentTime() }
    }).then(() => {
      this.showToast('Job is approved, please assign a tradesperson now');
    })
  }

  assignTP(key) {
    var ref = firebase.database().ref('users/');
    var tp = []
    ref.orderByChild('role').equalTo('tradesperson').once('value', snap => {
      tp = snap.val();
    }).then(() => {
      let alert = this.alertCtrl.create({
        title: 'Select Tradesperson',
        message: 'You can assign multiple people to one job.',
        enableBackdropDismiss: false
      });

      Object.keys(tp).forEach(key => {
        alert.addInput({
          type: 'checkbox',
          label: tp[key].name,
          //'{ "name":"John", "age":30, "city":"New York"}'
          value: `{"tpId": "${key}", "tpName": "${tp[key].name}"}`,
          checked: false
        });
      })
      alert.addButton('Cancel');
      alert.addButton({
        text: 'Okay',
        handler: data => {
          console.log(data)
          var tpData = {}
          data.forEach(d => {
            tpData[`${JSON.parse(d).tpId}`] = { tpId: JSON.parse(d).tpId, tpName: JSON.parse(d).tpName }
          })
          firebase.database().ref('request/' + key + '/progress/').update({
            tpAssigned: { status: true, workers: tpData, timestamp: this.getCurrentTime() }
          }).then(() => {
            this.showToast('Workers have been assigned successfully.');
          })
        }
      });
      alert.present();
    });
  }

  showDetailsPage(key) {
    this.navCtrl.push(JobDetailsPage, {
      jobKey: key
    });
  }
  showProgresPage(key) {
    var jobTitle = ''

    this.navCtrl.push(ManagerJobProgressPage, {
      jobKey: key,
      jobTitle: jobTitle
    });
  }

  showToast(message) {
    this.toastCtrl.create({
      message: message,
      duration: 4000,
      position: 'bottom',
      showCloseButton: true,
      dismissOnPageChange: false
    }).present();
  }

  getCurrentTime() {
    var date = new Date();
    var newDate = new Date(8 * 60 * 60000 + date.valueOf() + (date.getTimezoneOffset() * 60000));
    var ampm = newDate.getHours() < 12 ? ' AM' : ' PM';
    var strDate = newDate + '';
    return (strDate).substring(0, strDate.indexOf(' GMT')) + ampm
  }
  logout() {
    this.af.auth.logout().then(() => {
      UserHelper.removeUser();
      this.navCtrl.push(LoginPage)

    });
  }
  showProgress(job) {

  }

}
