import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UsuarioService } from 'src/app/services/usuario.service';
import { getAuth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  correo: string = '';
  contrasena: string = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
  ) {}

  ngOnInit() {}

  async login() {
    const auth = getAuth();

    try {
      // Iniciar sesión con email y contraseña
      const userCredential = await signInWithEmailAndPassword(
        auth,
        this.correo,
        this.contrasena
      );

      // Usuario autenticado
      const user = userCredential.user;
      const uid = user.uid;
      console.log('Usuario autenticado con UID:', uid);

      // Obtener datos del usuario desde Firestore
      const userData = await this.usuarioService.getUsuarioUid(uid);

      if (userData) {
        console.log('Datos del usuario:', userData);

        // Guardar los datos del usuario en localStorage
        localStorage.setItem('usuario', JSON.stringify(userData));

        // Redirigir al home
        await this.mostrarAlerta(
          'Inicio de sesión exitoso',
          'Bienvenid@!'
        );
        this.router.navigate(['/home']);
      } else {
        console.error('El documento del usuario no existe en la base de datos');
        await this.mostrarAlerta(
          'Error',
          'El usuario no existe en la base de datos. Verifica tus credenciales'
        );
      }
    } catch (error: any) {
      // Manejo de errores en la autenticación
      console.error('Error durante el inicio de sesión:', error);
      console.error('Código de error:', error.code);

      // Mensajes de error personalizados
      switch (error.code) {
        case 'auth/user-not-found':
          await this.mostrarAlerta(
            'Usuario no encontrado',
            'El correo ingresado no está registrado. Verifica tu información'
          );
          break;
        case 'auth/wrong-password':
          await this.mostrarAlerta(
            'Contraseña incorrecta',
            'La contraseña ingresada es incorrecta. Inténtalo de nuevo'
          );
          break;
        case 'auth/invalid-email':
          await this.mostrarAlerta(
            'Correo inválido',
            'El formato del correo electrónico no es válido. Verifica e inténtalo de nuevo'
          );
          break;
        default:
          await this.mostrarAlerta(
            'Error de inicio de sesión',
            'Ha ocurrido un error inesperado. Por favor, intenta nuevamente'
          );
          break;
      }
    }
  }

  // Mostrar alertas al usuario
  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['Aceptar'],
    });
    await alert.present();
  }
}