export const translations = {
  uz: {
    home: "Bosh sahifa", apps: "Ilovalar", reels: "Reels", aiChat: "AI Chat", profile: "Profil",
    grammar: "Grammatika", reading: "O'qish", writing: "Yozish", listening: "Eshitish", speaking: "Gapirish",
    vocabulary: "Lug'at", movies: "Kino", comics: "Komikslar", grammarChecker: "Grammatika tekshirgich",
    tips: "Maslahatlar", level: "Daraja", iknow: "Bilaman", idontknow: "Bilmayman",
    typeMessage: "Xabar yozing...", chatHistory: "Chat tarixi", newChat: "Yangi chat",
    knownWords: "Biladigan so'zlar", unknownWords: "Bilmaydigan so'zlar",
    editProfile: "Profilni tahrirlash", save: "Saqlash", cancel: "Bekor qilish",
    name: "Ism", noArtifacts: "Hali ilovalar yo'q", delete: "O'chirish", edit: "Tahrirlash",
    view: "Ko'rish", interactiveArtifact: "Interaktiv ilova", codeSnippet: "Kod qismi",
    preview: "Ko'rish", code: "Kod", premium: "Premium", ultra: "Ultra", free: "Bepul",
    locked: "Qulflangan", unlock: "Ochish", buyPremium: "Premium sotib oling",
    search: "Qidirish...", categories: "Kategoriyalar", all: "Barchasi", watch: "Ko'rish",
    ageRestriction: "18+ tarkib", read: "O'qish", check: "Tekshirish",
    uploadImage: "Rasm yuklash", writeText: "Matn yozing", results: "Natijalar",
    errors: "Xatolar", correct: "To'g'ri", requiredApps: "Kerakli ilovalar",
    myApps: "Mening ilovalarim", back: "Orqaga", undo: "Qaytarish",
    sendPayment: "To'lov yuborish", paymentPending: "To'lov kutilmoqda",
    dailyLimit: "Kunlik limit tugadi", upgradeNow: "Hozir yangilang",
    stopGeneration: "To'xtatish",
  },
  en: {
    home: "Home", apps: "Apps", reels: "Reels", aiChat: "AI Chat", profile: "Profile",
    grammar: "Grammar", reading: "Reading", writing: "Writing", listening: "Listening", speaking: "Speaking",
    vocabulary: "Vocabulary", movies: "Movies", comics: "Comics", grammarChecker: "Grammar Checker",
    tips: "Tips", level: "Level", iknow: "I know", idontknow: "I don't know",
    typeMessage: "Type a message...", chatHistory: "Chat History", newChat: "New Chat",
    knownWords: "Known Words", unknownWords: "Unknown Words",
    editProfile: "Edit Profile", save: "Save", cancel: "Cancel",
    name: "Name", noArtifacts: "No apps yet", delete: "Delete", edit: "Edit",
    view: "View", interactiveArtifact: "Interactive App", codeSnippet: "Code Snippet",
    preview: "Preview", code: "Code", premium: "Premium", ultra: "Ultra", free: "Free",
    locked: "Locked", unlock: "Unlock", buyPremium: "Get Premium",
    search: "Search...", categories: "Categories", all: "All", watch: "Watch",
    ageRestriction: "18+ content", read: "Read", check: "Check",
    uploadImage: "Upload Image", writeText: "Write text", results: "Results",
    errors: "Errors", correct: "Correct", requiredApps: "Required Apps",
    myApps: "My Apps", back: "Back", undo: "Undo",
    sendPayment: "Send Payment", paymentPending: "Payment Pending",
    dailyLimit: "Daily limit reached", upgradeNow: "Upgrade Now",
    stopGeneration: "Stop",
  }
};

import { useAppStore } from './store';

export const useTranslation = () => {
  const language = useAppStore((s) => s.language);
  return (key: keyof typeof translations.en) => translations[language]?.[key] || key;
};
