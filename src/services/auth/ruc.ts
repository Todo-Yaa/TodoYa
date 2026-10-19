/** Verifica un RUC peruano opcional sin consultar ni simular a SUNAT.
 * La comprobación de existencia/titularidad sigue siendo un paso independiente. */
export function validPeruRuc(ruc: string): boolean {
  if (!/^(10|15|17|20)[0-9]{9}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(ruc[index]) * weight, 0);
  return (11 - (sum % 11)) % 10 === Number(ruc[10]);
}
