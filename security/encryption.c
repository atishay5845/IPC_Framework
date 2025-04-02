/*
=============================
Phase 3: Implement AES Encryption for Shared Memory & Message Queues
=============================
*/
#include <openssl/aes.h>
#include <string.h>

void encrypt_decrypt(char *input, char *output, int mode) {
    AES_KEY aes_key;
    unsigned char key[16] = "1234567890123456";
    
    if (mode == AES_ENCRYPT) {
        AES_set_encrypt_key(key, 128, &aes_key);
        AES_encrypt((unsigned char *)input, (unsigned char *)output, &aes_key);
    } else {
        AES_set_decrypt_key(key, 128, &aes_key);
        AES_decrypt((unsigned char *)input, (unsigned char *)output, &aes_key);
    }
}

int main() {
    char input[] = "SecureIPC";
    char encrypted[16];
    char decrypted[16];
    
    encrypt_decrypt(input, encrypted, AES_ENCRYPT);
    encrypt_decrypt(encrypted, decrypted, AES_DECRYPT);
    
    printf("Original: %s\n", input);
    printf("Decrypted: %s\n", decrypted);
    return 0;
}
