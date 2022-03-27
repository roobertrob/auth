import axios, { AxiosError } from "axios";
import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { signOut } from "../utils/signOut";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedResquestsQueue = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);
  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["next-auth.token"]}`,
    },
  });

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        if (error.response.data?.code === "token.expired") {
          //renova o token
          cookies = parseCookies(ctx);
          const { "next-auth.refreshToken": refreshToken } = cookies;
          const originalConfig = error.config;
          if (!isRefreshing) {
            isRefreshing = true;
            api
              .post("refresh", {
                refreshToken,
              })
              .then((response) => {
                const token = response.data.token;
                setCookie(ctx, "next-auth.token", token, {
                  //contexto, nome do armazenamento, o que será armazenado
                  maxAge: 60 * 60 * 24 * 30,
                  path: "/",
                });
                setCookie(
                  ctx,
                  "next-auth.refreshToken",
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30,
                    path: "/",
                  },
                );
                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;
                failedResquestsQueue.forEach((request) =>
                  request.resolve(token),
                );
                failedResquestsQueue = [];
              })
              .catch((err) => {
                failedResquestsQueue.forEach((request) => request.reject(err));
                failedResquestsQueue = [];
                if (process.browser) {
                  signOut();
                } else {
                  return Promise.reject()
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }
          return new Promise((resolve, reject) => {
            failedResquestsQueue.push({
              resolve: (token: string) => {
                originalConfig.headers["Authorization"] = `Bearer ${token}`;
                resolve(api(originalConfig));
              },
              reject: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        }
      } else {
        signOut();
      }

      return Promise.reject(new AuthTokenError());
    },
  ); //intercepta a resposta do backend
  return api;
}
