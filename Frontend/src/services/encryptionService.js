import sodium from 'libsodium-wrappers'

class EncryptionService {
  constructor() {
    this.privateKey = null
    this.publicKey = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return

    await sodium.ready
    this.isInitialized = true
    console.log('🔐 Encryption service initialized')
  }

  // Generate a new key pair for user registration
  async generateKeyPair() {
    await this.initialize()

    const keyPair = sodium.crypto_box_keypair()
    
    return {
      publicKey: sodium.to_base64(keyPair.publicKey),
      privateKey: sodium.to_base64(keyPair.privateKey)
    }
  }

  // Store private key securely (encrypted with user password)
  async storePrivateKey(privateKey, password) {
    await this.initialize()

    try {
      // Derive key from password
      const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
      const derivedKey = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
      )

      // Encrypt private key
      const privateKeyBytes = sodium.from_base64(privateKey)
      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
      const encryptedPrivateKey = sodium.crypto_secretbox_easy(privateKeyBytes, nonce, derivedKey)

      // Store encrypted private key and salt
      const encryptedData = {
        encryptedPrivateKey: sodium.to_base64(encryptedPrivateKey),
        nonce: sodium.to_base64(nonce),
        salt: sodium.to_base64(salt),
        timestamp: Date.now()
      }

      localStorage.setItem('sniffguard-private-key', JSON.stringify(encryptedData))
      this.privateKey = privateKey

      return true
    } catch (error) {
      console.error('Failed to store private key:', error)
      return false
    }
  }

  // Load private key from storage
  async loadPrivateKey(password) {
    await this.initialize()

    try {
      const encryptedData = localStorage.getItem('sniffguard-private-key')
      if (!encryptedData) {
        throw new Error('No private key found')
      }

      const data = JSON.parse(encryptedData)
      
      // Derive key from password
      const salt = sodium.from_base64(data.salt)
      const derivedKey = sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
      )

      // Decrypt private key
      const encryptedPrivateKey = sodium.from_base64(data.encryptedPrivateKey)
      const nonce = sodium.from_base64(data.nonce)
      const privateKeyBytes = sodium.crypto_secretbox_open_easy(
        encryptedPrivateKey,
        nonce,
        derivedKey
      )

      this.privateKey = sodium.to_base64(privateKeyBytes)
      return this.privateKey
    } catch (error) {
      console.error('Failed to load private key:', error)
      throw new Error('Invalid password or corrupted key')
    }
  }

  // Set public key
  setPublicKey(publicKey) {
    this.publicKey = publicKey
  }

  // Clear keys from memory
  clearKeys() {
    this.privateKey = null
    this.publicKey = null
  }

  // Generate random symmetric key for message encryption
  generateSymmetricKey() {
    return sodium.to_base64(sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES))
  }

  // Encrypt message with symmetric key
  async encryptMessage(message, symmetricKey) {
    await this.initialize()

    try {
      const keyBytes = sodium.from_base64(symmetricKey)
      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
      const messageBytes = sodium.from_string(message)
      
      const encrypted = sodium.crypto_secretbox_easy(messageBytes, nonce, keyBytes)
      
      return {
        encryptedContent: sodium.to_base64(encrypted),
        nonce: sodium.to_base64(nonce),
        algorithm: 'XSalsa20-Poly1305' // libsodium encryption algorithm
      }
    } catch (error) {
      console.error('Message encryption failed:', error)
      throw new Error('Failed to encrypt message')
    }
  }

  // Decrypt message with symmetric key
  async decryptMessage(encryptedContent, nonce, symmetricKey) {
    await this.initialize()

    try {
      const keyBytes = sodium.from_base64(symmetricKey)
      const nonceBytes = sodium.from_base64(nonce)
      const encryptedBytes = sodium.from_base64(encryptedContent)
      
      const decrypted = sodium.crypto_secretbox_open_easy(encryptedBytes, nonceBytes, keyBytes)
      
      return sodium.to_string(decrypted)
    } catch (error) {
      console.error('Message decryption failed:', error)
      throw new Error('Failed to decrypt message')
    }
  }

  // Encrypt symmetric key for a recipient using their public key
  async encryptKeyForRecipient(symmetricKey, recipientPublicKey) {
    await this.initialize()

    if (!this.privateKey) {
      throw new Error('Private key not loaded')
    }

    try {
      const senderPrivateKey = sodium.from_base64(this.privateKey)
      const recipientPubKey = sodium.from_base64(recipientPublicKey)
      const keyBytes = sodium.from_base64(symmetricKey)
      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
      
      const encryptedKey = sodium.crypto_box_easy(keyBytes, nonce, recipientPubKey, senderPrivateKey)
      
      return {
        encryptedKey: sodium.to_base64(encryptedKey),
        nonce: sodium.to_base64(nonce)
      }
    } catch (error) {
      console.error('Key encryption failed:', error)
      throw new Error('Failed to encrypt key for recipient')
    }
  }

  // Decrypt symmetric key using our private key
  async decryptKeyFromSender(encryptedKey, nonce, senderPublicKey) {
    await this.initialize()

    if (!this.privateKey) {
      throw new Error('Private key not loaded')
    }

    try {
      const recipientPrivateKey = sodium.from_base64(this.privateKey)
      const senderPubKey = sodium.from_base64(senderPublicKey)
      const encryptedKeyBytes = sodium.from_base64(encryptedKey)
      const nonceBytes = sodium.from_base64(nonce)
      
      const keyBytes = sodium.crypto_box_open_easy(
        encryptedKeyBytes,
        nonceBytes,
        senderPubKey,
        recipientPrivateKey
      )
      
      return sodium.to_base64(keyBytes)
    } catch (error) {
      console.error('Key decryption failed:', error)
      throw new Error('Failed to decrypt key from sender')
    }
  }

  // Prepare encrypted message for sending
  async prepareEncryptedMessage(message, recipients) {
    await this.initialize()

    try {
      // Generate symmetric key for this message
      const symmetricKey = this.generateSymmetricKey()
      
      // Encrypt the message
      const encryptedMessage = await this.encryptMessage(message, symmetricKey)
      
      // Prepare encrypted data for each recipient
      const recipientData = []
      
      for (const recipient of recipients) {
        const { encryptedKey, nonce } = await this.encryptKeyForRecipient(
          symmetricKey,
          recipient.publicKey
        )
        
        recipientData.push({
          userId: recipient.userId,
          encryptedContent: encryptedMessage.encryptedContent,
          encryptedKey: encryptedKey
        })
      }
      
      return {
        recipients: recipientData,
        encryption: {
          algorithm: encryptedMessage.algorithm,
          keyId: sodium.to_base64(sodium.randombytes_buf(16)), // Random key ID
          nonce: encryptedMessage.nonce,
          authTag: '' // Will be filled by backend if needed
        }
      }
    } catch (error) {
      console.error('Failed to prepare encrypted message:', error)
      throw new Error('Failed to prepare encrypted message')
    }
  }

  // Decrypt received message
  async decryptReceivedMessage(encryptedContent, encryptedKey, nonce, keyNonce, senderPublicKey) {
    await this.initialize()

    try {
      // First decrypt the symmetric key
      const symmetricKey = await this.decryptKeyFromSender(
        encryptedKey,
        keyNonce,
        senderPublicKey
      )
      
      // Then decrypt the message
      const decryptedMessage = await this.decryptMessage(
        encryptedContent,
        nonce,
        symmetricKey
      )
      
      return decryptedMessage
    } catch (error) {
      console.error('Failed to decrypt received message:', error)
      throw new Error('Failed to decrypt message')
    }
  }

  // Generate hash for message integrity
  generateHash(data) {
    return sodium.to_base64(sodium.crypto_generichash(32, sodium.from_string(data)))
  }

  // Verify message integrity
  verifyHash(data, hash) {
    const calculatedHash = this.generateHash(data)
    return calculatedHash === hash
  }

  // Generate random bytes
  generateRandomBytes(length = 32) {
    return sodium.to_base64(sodium.randombytes_buf(length))
  }

  // Secure random string for IDs
  generateSecureId() {
    return sodium.to_base64(sodium.randombytes_buf(16))
  }

  // Check if encryption is available
  isAvailable() {
    return this.isInitialized
  }

  // Get encryption info
  getEncryptionInfo() {
    return {
      algorithm: 'XSalsa20-Poly1305',
      keySize: 256,
      library: 'libsodium',
      isAvailable: this.isInitialized,
      hasPrivateKey: !!this.privateKey,
      hasPublicKey: !!this.publicKey
    }
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService()

// Export class for testing
export { EncryptionService }