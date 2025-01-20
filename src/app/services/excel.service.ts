import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private firestore: AngularFirestore) {}

  async addRecordToFirestore(record: Record<string, any>) {
    try {
      await this.firestore.collection('excel').add(record); // Agregar un documento a la colección 'excel'
    } catch (error) {
      console.error('Error al agregar el registro a Firestore:', error);
      throw error;
    }
  }

  async processExcel(file: File): Promise<Record<string, any>[]> {
    const fileReader = new FileReader();
  
    return new Promise<Record<string, any>[]>((resolve, reject) => {
      fileReader.onload = async (event: any) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
  
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!worksheet) {
            reject(new Error('No se encontró la hoja en el archivo Excel.'));
            return;
          }
  
          const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!jsonData || jsonData.length < 2) {
            reject(new Error('El archivo Excel está vacío o no tiene datos suficientes.'));
            return;
          }
  
          const headers = jsonData[0] as string[];  // Cabeceras (columnas)
          const rows = jsonData.slice(1); // Datos de las filas
  
          // Filtrar filas vacías o incompletas
          const filteredRows = rows.filter(row => row.some(cell => cell !== null && cell !== ''));
  
          // Crear los registros asegurando el orden de las columnas
          const formattedData = filteredRows.map((row) => {
            const record: Record<string, any> = {};
            headers.forEach((header, index) => {
              // Asegurarse de que el valor de la columna se asigne al campo correspondiente
              record[header] = row[index] ?? null; // Usar null si el valor es indefinido
            });
            return record;
          });
  
          resolve(formattedData); // Retornamos los datos procesados respetando el orden de las columnas
        } catch (error) {
          console.error('Error al procesar el archivo Excel:', error);
          reject(error);
        }
      };
  
      fileReader.readAsArrayBuffer(file);
    });
  }

  // Método para obtener la colección
  getExcelData(): Observable<any[]> {
    return this.firestore.collection('excel').valueChanges();
  }

  async eliminarColeccion(idColeccion: string){
    const collectionRef = this.firestore.collection(idColeccion);
    const snapshot = await collectionRef.get().toPromise();

    snapshot?.forEach((doc) => {
      collectionRef.doc(doc.id).delete();
    })
  }
}
