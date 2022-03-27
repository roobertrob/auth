import  Router  from "next/router";
import { destroyCookie } from "nookies";
import { authChannel } from "../contexts/AuthContext";

export function signOut() {
  destroyCookie(undefined, "next-auth.token");
  destroyCookie(undefined, "next-auth.refreshToken");

  authChannel.postMessage('signOut')

  Router.push("/");
}
