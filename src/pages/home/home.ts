import { Component } from '@angular/core';
import { NavController, 
  AlertController, // To Add Button
  ActionSheetController // To delete
 } from 'ionic-angular';

import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { AngularFireAuth} from 'angularfire2/auth';
import * as firebase from 'firebase/app';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  currentUser:any;
  messagesRef:any;
  messages: AngularFireList<any>;
  
  constructor(
    public navCtrl: NavController, 
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public afDatabase: AngularFireDatabase,
    public afAuth: AngularFireAuth
  ) {
    this.messagesRef = afDatabase.list('messages');
    this.messages = this.messagesRef.valueChanges();
    afAuth.authState.subscribe(user => {
      if (!user) {
        this.currentUser = null;
        return;
      }
      this.currentUser = {uid:user.uid, photoURL: user.photoURL, name: user.displayName};
      
    });
  }
  selectMessageType(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Que tipo de mensaje deseas publicar?',
      buttons: [
        {
          text: 'Mensaje Privado',
          handler: () => {
            this.addMessage(1);
          }
        },{
          text: 'Mensaje para Amigos',
          handler: () => {
            this.addMessage(2);
          }
        },{
          text: 'Mensaje Publico',
          handler: () => {
            this.addMessage(3);
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }
  addMessage(type){
    let prompt = this.alertCtrl.create({
      title: 'Crear Mensaje',
      message: "introduzca un mensaje",
      inputs: [
        {
          name: 'mensaje',
          placeholder: 'Mensaje'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            const newMessageRef = this.messagesRef.push({});

            if (type==1) {
              newMessageRef.set({
                id: newMessageRef.key,
                message: data.mensaje,
                uid: this.currentUser.uid,
                likes:0,
                type: "privado"
              });
            } else {
              if (type==2) {
                newMessageRef.set({
                  id: newMessageRef.key,
                  message: data.mensaje,
                  uid: this.currentUser.uid,
                  likes:0,
                  type: "amigos"
                });
              } else {
                if (type==3) {
                  newMessageRef.set({
                    id: newMessageRef.key,
                    message: data.mensaje,
                    uid: this.currentUser.uid,
                    likes:0,
                    type: "publico"
                  });
                }
              }
            }
          }
        }
      ]
    });
    prompt.present();
  }

  showOptions(songId, songTitle) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'What do you want to do?',
      buttons: [
        {
          text: 'Delete Song',
          role: 'destructive',
          handler: () => {
            this.removeSong(songId);
          }
        },{
          text: 'Update title',
          handler: () => {
            this.updateSong(songId, songTitle);
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }

  removeSong(songId: string){
    this.messagesRef.remove(songId);
  }

  updateSong(songId, songTitle){
    let prompt = this.alertCtrl.create({
      title: 'Song Name',
      message: "Update the name for this song",
      inputs: [
        {
          name: 'title',
          placeholder: 'Title',
          value: songTitle
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            this.messagesRef.update(songId, {
              title: data.title, lastUpdatedBy: this.currentUser.uid
            });
          }
        }
      ]
    });
    prompt.present();
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then((response)=>{
      console.log('resultado login google:', response);
      
      const userRef = this.afDatabase.list('users');

      userRef.update(response.user.uid, 
        {
          userId: response.user.uid, 
          displayName: response.user.displayName,
          photoURL: response.user.photoURL
        });
      //userRef.push({userId: xx.user.uid, displayName: xx.user.displayName}).then((xx)=>{

      //});
      
    });
  }

  
  logout() {
    this.afAuth.auth.signOut();
  }

  getItems(ev: any) {
    // Reset items back to all of the items
    this.messagesRef = this.afDatabase.list('songs');
    this.messages = this.messagesRef.valueChanges();
    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.messagesRef = this.afDatabase.list('songs',ref => ref.orderByChild('title').startAt(val));
      this.messages = this.messagesRef.valueChanges();
    }
  }

  
}
