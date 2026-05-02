import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value))
}

export function formatDate(value: string) {
  return dayjs(value).format('DD/MM/YYYY')
}

export function formatDateTime(value: string) {
  return dayjs(value).format('DD/MM/YYYY HH:mm')
}
