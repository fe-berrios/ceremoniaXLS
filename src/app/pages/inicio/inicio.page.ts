import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { ExcelService } from 'src/app/services/excel.service';
import * as XLSX from  'xlsx';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {
  file: File | null = null; // Variable para almacenar el archivo seleccionado
  excelData: any[] = []; // Variable para almacenar los datos
  columns: string[] = []; // Almacena las claves (nombres de columnas)

  constructor(
    private excelService: ExcelService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadExcelData();
  }

  recargar(){
    window.location.reload();
  }

  alertaConfirmacion(){
    const alert = this.alertController.create({
      header:'Confirmar',
      message:'Seguro?',
      buttons: [{
        text:'cancelar',
        role:'cancel',
        cssClass:'secondary',
        handler: () => {
          console.log("cancelado");
        }
      },
      {
        text:'Eliminar',
        handler: () => {
          this.eliminarFirebase();
        }
      }
    ]
    });
  }

  async eliminarFirebase() {
    const alerta = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar los datos?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Acción cancelada');
          }
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.excelService.eliminarColeccion('excel');
            alert("Colección eliminada");
          }
        }
      ]
    });
  
    await alerta.present();
  }

  // Método para cargar los datos
  loadExcelData() {
    this.excelService.getExcelData().subscribe(
      (data) => {
        this.excelData = data;

        // Extraer las claves dinámicamente si hay datos
        if (this.excelData.length > 0) {
          this.columns = Object.keys(this.excelData[0]); // Extraer nombres de columnas
        }
      },
      (error) => {
        console.error('Error al cargar los datos:', error);
      }
    );
  }

  // Manejar el evento de selección de archivo
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (
      file &&
      (file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel')
    ) {
      this.file = file;
    } else {
      this.file = null;
      this.showToast('Por favor selecciona un archivo válido (Excel).');
    }
  }

  // Subir el archivo a Firebase
  async uploadToFirebase() {
    if (!this.file) {
      this.showToast('Por favor selecciona un archivo.');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: 'Subiendo archivo...',
    });
    await loading.present();
  
    try {
      // Procesar el archivo Excel y obtener los datos
      const excelData = await this.excelService.processExcel(this.file);
  
      // Agregar la columna 'asistencia' a los datos
      excelData.forEach(row => {
        row['ASISTENCIA'] = false;  // Valor predeterminado de la columna 'asistencia'
      });
  
      // Subir los datos a Firebase
      for (const record of excelData) {
        await this.excelService.addRecordToFirestore(record);
      }
  
      this.showToast('Archivo subido exitosamente a Firebase.');
    } catch (error) {
      console.error('Error al subir el archivo Excel:', error);
      this.showToast('Hubo un error al procesar el archivo.');
    } finally {
      loading.dismiss();
    }
  }

  async exportarExcel(){
    // Rescata los datos de la tabla por id
    const tabla: HTMLTableElement = document.getElementById('xlsx_tabla') as HTMLTableElement;

    // Escribe los datos de tabla a excel sheet
    const escribir_datos: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tabla);

    // Crea un nuevo libro excel
    const libroExcel: XLSX.WorkBook = XLSX.utils.book_new();

    // Junta los datos rescatados con el libro de excel creado.
    XLSX.utils.book_append_sheet(libroExcel, escribir_datos, 'Datos');

    // Escribe/crea el archivo.
    XLSX.writeFile(libroExcel, 'datos_excel.xlsx')
  }

  // Mostrar mensajes de notificación
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
    });
    toast.present();
  }
}
