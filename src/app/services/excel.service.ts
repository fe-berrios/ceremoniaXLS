import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private firestore: AngularFirestore) {}

  async processExcel(file: File): Promise<void> {
    const fileReader = new FileReader();

    return new Promise<void>((resolve, reject) => {
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

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);

          const filteredRows = rows.filter(row => row.some(cell => cell !== null && cell !== ''));

          const formattedData = filteredRows.map((row) => {
            const record: Record<string, any> = {};
            headers.forEach((header, index) => {
              record[header] = row[index] ?? null;
            });
            return record;
          });

          for (const record of formattedData) {
            await this.firestore.collection('excel').add(record);
          }

          resolve();
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
