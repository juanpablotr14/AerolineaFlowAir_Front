import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/models/Usuario';
import { MensajesService } from 'src/app/services/Mensajes/mensajes.service';
import { UsuarioService } from 'src/app/services/Usuarios/usuario.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {

  cedulaControl: FormControl = new FormControl('');

  cedulaErrors = {
    required: 'La cédula es requerida',
    pattern: 'La cédula debe contener solo números',
    exist: 'La cédula ingresada ya existe',
    specialChars: 'La cédula no puede contener caracteres especiales'
  };

  registrationForm: FormGroup;
  usuarios: any[];
  disponible = false;

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private _usuarioService: UsuarioService,
    private _mensajeService: MensajesService
  ) {
    this.registrationForm = this._formBuilder.group({
      cedula: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(\\s[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(\\s[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$')]],
      correo: ['', [Validators.required, Validators.pattern('^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$')]],
    });
  }

  ngOnInit(): void {
    this.getUsuarios();
    this.registrationForm.setControl('cedula', this.cedulaControl);
    this.cedulaControl.valueChanges.subscribe((value) => {
      this.cedulaControl.setErrors(null);
    });
  }

  getUsuarios(): void {
    this._usuarioService.getUsuarioList().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });
  }

  getCedulas(cedula: string): boolean {
    for (let i = 0; i < this.usuarios.length; i++) {
      if (cedula === this.usuarios[i].cedula) {
        return true;
      }
    }
    return false;
  }

  onCedulaInput(): void {
    const cedula = this.registrationForm.get('cedula').value;
    const isValid = /^\d+$/.test(cedula); // Validar si solo contiene números
    if (!isValid) {
      this.cedulaControl.setErrors({ specialChars: true }); // Establecer error si contiene caracteres especiales
    } else {
      const exists = this.getCedulas(cedula);
      if (exists) {
        this.cedulaControl.setErrors({ exist: true }); // Establecer error si la cédula existe
      }
    }
  }

  capitalizeWords(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }


  capitalizeInput(controlName: string): void {
    const control = this.registrationForm.get(controlName);
    if (control && control.value) {
      control.setValue(this.capitalizeWords(control.value), { emitEvent: false });
    }
  }

  lowercaseInput(controlName: string): void {
    const control = this.registrationForm.get(controlName);
    if (control && control.value) {
      control.setValue(control.value.toLowerCase(), { emitEvent: false });
    }
  }


  onFormSubmit() {
    if (this.registrationForm.valid) {
      const newUsuario = {
        idUsuario: 1000,
        idRolusuario: '2',
        cedula: this.registrationForm.get('cedula').value,
        nombre: this.registrationForm.get('nombre').value,
        apellido: this.registrationForm.get('apellido').value,
        correo: this.registrationForm.get('correo').value,
        estado: 'A',
      };

      this._usuarioService.addUsuario(newUsuario).subscribe({
        next: (val: any) => {
          this._mensajeService.openSnackBar('Usuario creado correctamente!');
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this._mensajeService.openSnackBar(err.error.mensaje)
          console.log(err);
        },
      });
    }
  }
}
