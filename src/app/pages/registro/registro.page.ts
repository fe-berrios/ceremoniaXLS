import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UsuarioService } from 'src/app/services/usuario.service';

import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {

  usuario = new FormGroup({
    rut: new FormControl('', []),
    nombre: new FormControl('', []),
    apellido: new FormControl('', []),
    correo: new FormControl('', []),
    contrasena: new FormControl('', [])
  })

  constructor(private usuarioService: UsuarioService, 
              private alertController: AlertController,
              private router: Router) { }

  ngOnInit() {
  }

  // Registro de usuario
  async registroUsuario(): Promise<void> {
    if (!this.usuario.valid) {
      await this.mostrarErroresFormulario();
      return;
    }

    const nuevoUsuario = this.usuario.getRawValue();

    try {
      if (!nuevoUsuario.rut) {
        await this.mostrarAlerta('Error', 'El campo RUT es obligatorio');
        return;
      }

      const usuarioCreado = await this.usuarioService.crearUsuario(nuevoUsuario);
      if (usuarioCreado) {
        await this.mostrarAlerta('Éxito', 'Usuario creado con éxito!');
        this.usuario.reset();
        this.router.navigate(['/login']);
      } else {
        await this.mostrarAlerta('Error', 'No se pudo registrar el usuario. Intenta nuevamente');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      await this.mostrarAlerta('Error', 'Hubo un problema al procesar tu registro. Intenta más tarde');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['Aceptar']
    });
    await alert.present();
  }

  async mostrarErroresFormulario() {
    let mensaje = 'Por favor corrige los siguientes errores:';
    for (const control in this.usuario.controls) {
      if (this.usuario.get(control)?.invalid) {
        mensaje += `<br>- ${control} es inválido`;
      }
    }
    await this.mostrarAlerta('Errores en el Formulario', mensaje);
  }
}