declare module 'languageDetector' {
    const eld:{detect:(arg0: string) => {language: string, getScores: Function, isReliable: Function};}
    export default eld
}