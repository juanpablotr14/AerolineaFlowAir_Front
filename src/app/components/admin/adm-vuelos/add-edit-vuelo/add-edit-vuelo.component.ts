import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Aeropuerto } from 'src/app/models/Aeropuerto';
import { AeropuertoService } from 'src/app/services/Aeropuerto/aeropuerto.service';
import { AsientoService } from 'src/app/services/Asiento/asiento.service';
import { AvionService } from 'src/app/services/Avion/avion.service';
import { MensajesService } from 'src/app/services/Mensajes/mensajes.service';
import { VueloService } from 'src/app/services/Vuelo/vuelo.service';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-add-edit-vuelo',
  templateUrl: './add-edit-vuelo.component.html',
  styleUrls: ['./add-edit-vuelo.component.css'],
})
export class AddEditVueloComponent {
  today = new Date();
  maxDate = new Date(new Date().getFullYear() + 1, 11, 31); // Ejemplo: fecha máxima de un año a partir de hoy
  departureDate: Date;
  minArrivalDate: string;


  vueloForm: FormGroup;
  aeropuertos: any[];

  myDatePicker: Date;

  fechaLlegada = '';
  fechaSalida = '';
  estado = '';

  currentDateTime: string = formatDate(new Date(), 'yyyy-MM-ddTHH:mm', 'en-US');

  constructor(
    private _fb: FormBuilder,
    private _vueloService: VueloService,
    private _aeropuertoService: AeropuertoService,
    private _dialogRef: MatDialogRef<AddEditVueloComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _mensajeService: MensajesService,
    private datePipe: DatePipe
  ) {
    this.vueloForm = this._fb.group({
      id: '',
      idAeropuertoOrigen: ['', Validators.required],
      idAeropuertoDestino: ['', Validators.required],
      precioVuelo: ['', [Validators.required, Validators.min(0)]],
      fechaSalida: ['', Validators.required],
      fechaLlegada: ['', Validators.required],
      precioAsientoTurista: ['', [Validators.required, Validators.min(0)]],
      precioAsientoPreferencial: ['', [Validators.required, Validators.min(0)]],
      precioAsientoVip: ['', [Validators.required, Validators.min(0)]],
      estado: ['', Validators.required],
    });

    if (this.data && this.data.id) {
      const idVuelo = this.data.idVuelo;
      const estado = this.data.precio; // Obtén el valor de aerolinea del objeto data
      this.vueloForm.get('idVuelo').setValue(idVuelo); // Establece el valor del campo 'id'
      this.vueloForm.get('estado').setValue(estado); // Establece el valor del campo 'aerolinea'
      this.vueloForm.patchValue(this.data);
    }

  }

  setMinArrivalDate(): void {
    const fechaSalidaValue = new Date(this.vueloForm.get('fechaSalida').value);
    if (fechaSalidaValue) {
      const minArrivalDate = new Date(fechaSalidaValue.getTime() + 24 * 60 * 60 * 1000);
      this.minArrivalDate = minArrivalDate.toISOString();
      this.vueloForm.get('fechaLlegada').setValue(null);
      this.checkFechaLlegadaValidity();
    }
  }

  validateFechaSalida(control: AbstractControl): ValidationErrors | null {
    const fechaSalidaValue = new Date(control.value);
    const fechaActual = new Date();

    if (fechaSalidaValue < fechaActual) {
      return { fechaPasada: true };
    }

    return null;
  }

  validateFechaLlegada(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fechaLlegadaValue = new Date(control.value);
        const fechaSalidaValue = new Date(this.vueloForm.get('fechaSalida').value);

        if (
          fechaLlegadaValue > fechaSalidaValue &&
          fechaLlegadaValue <= new Date(fechaSalidaValue.getTime() + 24 * 60 * 60 * 1000)
        ) {
          resolve({ fechaInvalida: true });
        } else {
          resolve(null);
        }
      }, 0);
    });
  }

  checkFechaLlegadaValidity(): void {
    const fechaLlegadaControl = this.vueloForm.get('fechaLlegada');
    const fechaLlegadaValue = new Date(fechaLlegadaControl.value);
    const fechaSalidaValue = new Date(this.vueloForm.get('fechaSalida').value);

    if (fechaLlegadaValue <= fechaSalidaValue || fechaLlegadaValue > new Date(fechaSalidaValue.getTime() + 24 * 60 * 60 * 1000)) {
      fechaLlegadaControl.setErrors({ fechaInvalida: true });
    } else {
      fechaLlegadaControl.setErrors(null);
    }
  }


  ngOnInit(): void {
    this.vueloForm.patchValue(this.data);
    this.getAeropuertosActivos();
  }

  onNoClick(): void {
    this._dialogRef.close(false);
  }

  getAeropuertosActivos() {
    this._aeropuertoService.getAeropuertosActivos().subscribe(
      (aeropuertos: Aeropuerto[]) => {
        this.aeropuertos = aeropuertos;
      },
      (error: any) => {
        console.log(error);
      }
    );
  }



  onFormSubmit() {
    if (this.vueloForm.valid) {

      this.estado = this.vueloForm.get('estado').value;

      if (this.estado == 'Activo') {
        this.estado = 'A';
      } else {
        this.estado = 'I';
      }

      if (this.data) {
        const updateVuelo = {
          idVuelo: this.data.idVuelo.toString(),
          idAeropuertoOrigen: this.vueloForm.get('idAeropuertoOrigen').value,
          idAeropuertoDestino: this.vueloForm.get('idAeropuertoDestino').value,
          precio: this.vueloForm.get('precioVuelo').value,
          precioAsientoPreferencial: this.vueloForm.get('precioAsientoPreferencial').value,
          precioAsientoVip: this.vueloForm.get('precioAsientoVip').value,
          precioAsientoTurista: this.vueloForm.get('precioAsientoTurista').value,
          fechaHoraSalida: this.vueloForm.get('fechaSalida').value,
          fechaHoraLlegada: this.vueloForm.get('fechaLlegada').value,
          estado: this.estado, // Establecer valor predeterminado si es un nuevo vuelo
        };

        this._vueloService.updateVuelo(updateVuelo).subscribe({
          next: (val: any) => {
            this._mensajeService.openSnackBar(
              'Vuelo actualizado correctamente!'
            );
            this._dialogRef.close(true);
          },
          error: (err: any) => {
            console.log(err);
          },
        });
      } else {
        const newVuelo = {
          idVuelo: '1000',
          idAeropuertoOrigen: this.vueloForm.get('idAeropuertoOrigen').value,
          idAeropuertoDestino: this.vueloForm.get('idAeropuertoDestino').value,
          precio: this.vueloForm.get('precioVuelo').value,
          precioAsientoPreferencial: this.vueloForm.get('precioAsientoPreferencial').value,
          precioAsientoVip: this.vueloForm.get('precioAsientoVip').value,
          precioAsientoTurista: this.vueloForm.get('precioAsientoTurista').value,
          fechaHoraSalida: this.vueloForm.get('fechaSalida').value,
          fechaHoraLlegada: this.vueloForm.get('fechaLlegada').value,
          estado: this.estado, // Establecer valor predeterminado si es un nuevo vuelo
        };

        console.log('Vuelo enviado: ', newVuelo);

        this._vueloService.addVuelo(newVuelo).subscribe({
          next: (val: any) => {
            this._mensajeService.openSnackBar('Vuelo añadido correctamente!');
            this._dialogRef.close(true);
            console.log('Vuelo añadido: ', newVuelo);

          },
          error: (err: any) => {
            console.log(err);
          },
        });
      }
    }
  }
}
