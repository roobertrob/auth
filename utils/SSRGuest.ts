import { GetServerSideProps, GetServerSidePropsContext } from "next/types";
import { parseCookies } from "nookies";

export function SSRGuest(fn: GetServerSideProps ) {
  return async (ctx: GetServerSidePropsContext) => {
    const cookies = parseCookies(ctx);
    if (cookies["next-auth.token"]) {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }

    return await fn(ctx);
  };
}
