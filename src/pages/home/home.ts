import { Component } from '@angular/core';
import {
  NavController,
  AlertController, // To Add Button
  ActionSheetController // To delete
} from 'ionic-angular';

import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  currentUser: any;
  messagesRef: any;
  messages: AngularFireList<any>;
  usersRef: any;
  users: AngularFireList<any>;
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public afDatabase: AngularFireDatabase,
    public afAuth: AngularFireAuth
  ) {
    this.messagesRef = afDatabase.list('messages');
    this.messages = this.messagesRef.valueChanges();

    this.usersRef = afDatabase.list('users');
    this.users = this.usersRef.valueChanges();

    afAuth.authState.subscribe(user => {
      if (!user) {
        this.currentUser = null;
        return;
      }
      this.currentUser = { uid: user.uid, photoURL: user.photoURL, name: user.displayName };

    });
  }
  selectMessageType() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Que tipo de mensaje deseas publicar?',
      buttons: [
        {
          text: 'Mensaje Privado',
          handler: () => {
            this.addMessage(1);
          }
        }, {
          text: 'Mensaje para Amigos',
          handler: () => {
            this.addMessage(2);
          }
        }, {
          text: 'Mensaje Publico',
          handler: () => {
            this.addMessage(3);
          }
        }, {
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
  addMessage(type) {
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

            if (type == 1) {
              newMessageRef.set({
                id: newMessageRef.key,
                message: data.mensaje,
                uid: this.currentUser.uid,
                photo: this.currentUser.photoURL,
                name: this.currentUser.name,
                likes: 0,
                type: "privado"
              });
            } else {
              if (type == 2) {
                newMessageRef.set({
                  id: newMessageRef.key,
                  message: data.mensaje,
                  uid: this.currentUser.uid,
                  photo: this.currentUser.photoURL,
                  name: this.currentUser.name,
                  likes: 0,
                  type: "amigos"
                });
              } else {
                if (type == 3) {
                  newMessageRef.set({
                    id: newMessageRef.key,
                    message: data.mensaje,
                    uid: this.currentUser.uid,
                    photo: this.currentUser.photoURL,
                    name: this.currentUser.name,
                    likes: 0,
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



  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then((response) => {
        console.log('resultado login google:', response);

        const userRef = this.afDatabase.list('users');

        userRef.update(response.user.uid,
          {
            userId: response.user.uid,
            displayName: response.user.displayName,
            photoURL: response.user.photoURL,
            following: [""],
            favs: [""]
          });
        //userRef.push({userId: xx.user.uid, displayName: xx.user.displayName}).then((xx)=>{

        //});

      });
  }


  logout() {
    this.afAuth.auth.signOut();
  }


  verMensaje(message) {
    var render = false;
    if (message.type == "publico") {
      render=true;
    }
    if (message.type == "amigos") {
      var childData
      firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
          // key
          var key = childSnapshot.key;
          // value, could be object
          childData = childSnapshot.val();
          return true;
          // Do what you want with these key/values here
        });
        if ((childData.following).indexOf(message.uid) > -1 || childData.userId == message.uid) {
          render = true;
        }
      });
    }
    return render;
  }
  like(message) {
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
      (childData.favs).push(message.id);
      console.log(childData);

    });
    message.likes += 1;
    this.usersRef.update(childData.userId, childData);
    this.messagesRef.update(message.id, message);
  }

  unlike(message) {
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
      console.log(childData);
      delete childData.favs[childData.favs.indexOf(message.id)];
      console.log(childData);

    });
    message.likes -= 1;
    this.usersRef.update(childData.userId, childData);
    this.messagesRef.update(message.id, message);
  }
  isFav(message) {
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
    });
    console.log(childData);
    if (childData) {
      if ((childData.favs).indexOf(message.id) > -1) {
        return false;
      } else {
        return true;
      }
    }
  }
  follow(message) {
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
      (childData.following).push(message.uid);
      console.log(childData);
    });
    this.usersRef.update(childData.userId, childData);
  }
  isFollower(message){
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
    });
    console.log(childData);
    if (childData) {
      if ((childData.following).indexOf(message.uid) > -1) {
        return false;
      } else {
        return true;
      }
    }
  }
  unfollow(message) {
    var childData
    firebase.database().ref("/users").orderByChild("userId").equalTo(this.currentUser.uid).on("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
        // key
        var key = childSnapshot.key;
        // value, could be object
        childData = childSnapshot.val();
        return true;
        // Do what you want with these key/values here
      });
      console.log(childData);
      delete childData.following[childData.following.indexOf(message.uid)];
      console.log(childData);

    });
    this.usersRef.update(childData.userId, childData);
  }
}
