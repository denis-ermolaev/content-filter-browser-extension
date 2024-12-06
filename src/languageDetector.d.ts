/**
 * Т.к мы не хотим переписывать библиотеку определителя языка, декларируем
 * его и типизируем, чтобы TS не ругался на тип any
 */
declare module 'languageDetector' {
    const eld:{detect:(arg0: string) => {language: string, getScores: Function, isReliable: Function};}
    export default eld
}