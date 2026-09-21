import type { IAuth } from "@/auth";

class AuthService {
  auth: IAuth;

  constructor(auth: IAuth) {
    this.auth = auth;
  }

  // getOrd() {
  //   this.auth.api.getOrganization()
  // }
}
