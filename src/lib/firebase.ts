// Firebase 配置和初始化
import { initializeApp, getApps } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log('🔥 Firebase 配置初始化:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
})

// 初始化 Firebase（避免重复初始化）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

console.log('🚀 Firebase 应用初始化完成:', {
  appName: app.name,
  authName: auth.name,
  currentUser: auth.currentUser?.uid || 'null'
})

// Google 登录提供商
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// Firebase 认证服务
export class FirebaseAuthService {
  // Google 登录
  static async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔥 Firebase: 开始 Google 登录')
      console.log('🔧 Firebase: Auth 实例状态:', { 
        auth: !!auth, 
        currentUser: auth?.currentUser?.uid || 'null',
        app: !!auth?.app 
      })

      
      console.log('📱 Firebase: 调用 signInWithPopup...')
      const result = await signInWithPopup(auth, googleProvider)
      
      console.log('✅ Firebase: Google 登录成功:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        providerId: result.providerId,
        operationType: result.operationType
      })
      
      return result.user
    } catch (error: any) {
      console.error('💥 Firebase: Google 登录失败:', {
        code: error.code,
        message: error.message,
        authErrorCode: error.auth?.code,
        customData: error.customData,
        fullError: error
      })
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // 邮箱密码登录
  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error: any) {
      console.error('邮箱登录失败:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // 邮箱密码注册
  static async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // 更新用户显示名称
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName })
      }
      
      return result.user
    } catch (error: any) {
      console.error('邮箱注册失败:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // 发送密码重置邮件
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('发送密码重置邮件失败:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // 登出
  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('登出失败:', error)
      throw new Error('登出失败，请重试')
    }
  }

  // 监听认证状态变化
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  // 获取当前用户
  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  // 错误消息映射
  private static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '用户不存在',
      'auth/wrong-password': '密码错误',
      'auth/email-already-in-use': '邮箱已被使用',
      'auth/weak-password': '密码强度不够，至少需要6位字符',
      'auth/invalid-email': '邮箱格式无效',
      'auth/user-disabled': '用户账户已被禁用',
      'auth/too-many-requests': '请求过于频繁，请稍后再试',
      'auth/popup-closed-by-user': '登录窗口被用户关闭',
      'auth/cancelled-popup-request': '登录请求被取消',
      'auth/popup-blocked': '登录窗口被浏览器阻止',
      'auth/invalid-credential': '无效的登录凭据',
    }

    return errorMessages[errorCode] || '登录失败，请重试'
  }
}

export { auth }
export default app
