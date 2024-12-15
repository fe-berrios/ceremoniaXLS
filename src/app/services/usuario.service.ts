import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private fireStore: AngularFirestore, 
              private fireAuth:  AngularFireAuth) { }

    // Usuarios(crud)
    async crearUsuario(usuario: any){
      const docRef = this.fireStore.collection('usuarios').doc(usuario.rut);
      const docActual = await docRef.get().toPromise();
      if(docActual?.exists){
        return false;
      }
  
      const credencialesUsuario = await this.fireAuth.createUserWithEmailAndPassword(usuario.correo, usuario.contrasena);
      const uid = credencialesUsuario.user?.uid;
      await docRef.set({...usuario, uid});
      return true;
    }
  
    getUsuarios(){
      return this.fireStore.collection('usuarios').valueChanges();
    }
  
    getUsuario(rut: string){
      return this.fireStore.collection('usuarios').doc(rut).valueChanges();
    }
  
    updateUsuario(usuario: any): Promise<any>{
      return this.fireStore.collection('usuarios').doc(usuario.rut).update(usuario);
    }
  
    deleteUsuario(rut: string): Promise<any>{
      return this.fireStore.collection('usuarios').doc(rut).delete();
    }
  
    getUsuarioUid(uid: string): Promise<any>{
      return this.fireStore.collection('usuarios', ref => ref.where('uid', '==', uid)).get().toPromise().then((snapshot) => {
        if (snapshot && !snapshot.empty){
          return snapshot.docs[0].data();
        }
        return null;
      }).catch((error) => {
        console.error("Error al obtener usuario:", error);
        return null;
      })
    }
}
