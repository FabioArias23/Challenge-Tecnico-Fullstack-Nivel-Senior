import { IsArray, IsNotEmpty, IsString, IsDateString, ArrayMinSize } from 'class-validator';
//aca creo el LOTE en ingles Batch

//grupo de elementos procesados juntos o a un tipo de procesamiento informático que ejecuta tareas en secuencia sin intervención del usuario
export class CreateBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty()
  pendingIds: number[]; // Lista de IDs de pendientes a facturar

  @IsString()
  @IsNotEmpty()
  receiptBook: string; // Ej: "0001"

  @IsDateString()
  @IsNotEmpty()
  issueDate: string; // Fecha de emisión forzada (YYYY-MM-DD)
}