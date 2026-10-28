import { Injectable } from "@nestjs/common";
import { hash, verify } from "@node-rs/argon2";

/** argon2id hashing (the library default) */
@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Burns the same time as a real check when the account does not exist,
   * so response timing does not reveal which usernames/emails are registered.
   */
  async verifyAgainstDummy(password: string): Promise<false> {
    this.dummyHash ??= hash("dummy-password-for-timing");
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
