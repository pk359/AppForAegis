import { Job } from './../../common/Model/Job';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { AngularFire } from 'angularfire2'
import firebase from 'firebase'
import { LoginPage } from '../../common/login-page/login-page'
import { JobDetailsPage } from '../../common/job-details-page/job-details-page'
import { ManagerJobProgressPage } from '../job-progress-page/job-progress-page'


@Component({
  templateUrl: 'current-jobs-page.html',
})
export class ManagerCurrentJobsPage {

  cUser: any
  currentJobs: Job[] = []
  ref: any
  constructor(public navCtrl: NavController, public navParams: NavParams, public af: AngularFire, public toastCtrl: ToastController, public alertCtrl: AlertController) {
    this.cUser = JSON.parse(window.localStorage.getItem('userdetails'));
    firebase.database().ref('requests').on('value', snap => {
      this.currentJobs = []
      if (snap.val()) {
        Object.keys(snap.val()).forEach(key => {
          var job: Job = new Job();
          Object.assign(job, snap.val()[key])
          this.currentJobs.push(job);
        })
      }
      console.log(this.currentJobs)
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
    this.currentJobs = null;
    this.af.auth.logout().then(() => {
      window.localStorage.removeItem('userdetails')
      this.navCtrl.push(LoginPage);
    });
  }
  showProgress(job) {

  }

}
