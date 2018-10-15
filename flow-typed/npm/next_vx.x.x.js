// flow-typed signature: 84314078760d72f3d91c488a859fbfd0
// flow-typed version: <<STUB>>/next_v^7.0.1/flow_v0.82.0
/* @flow */

declare module "next" {
  declare type NextApp = {
    prepare(): Promise<void>;
    getRequestHandler(): any;
    render(req: http$ClientRequest, res: http$ServerResponse, pathname: string, query: any): any;
    renderToHTML(req: http$ClientRequest, res: http$ServerResponse, pathname: string, query: string): string;
    renderError(err: Error, req: http$ClientRequest, res: http$ServerResponse, pathname: any, query: any): any;
    renderErrorToHTML(err: Error, req: http$ClientRequest, res: http$ServerResponse, pathname: string, query: any): string
  };
  declare module.exports: (...opts: any) => NextApp
}

declare type Head = Class<React$Component<{}, void>>;

declare module "next/head" {
  declare module.exports: Head;
}

declare module "next/link" {
  declare module.exports: Class<React$Component<{}, {href: string, prefetch?: boolean}>>;
}

declare module "next/error" {
  declare module.exports: Class<React$Component<{}, {statusCode: number}>>;
}

declare module "next/router" {
  declare export type Router = {
    route: string;
    pathname: string;
    query: Object;
    onRouteChangeStart: ?((url: string) => void);
    onRouteChangeComplete: ?((url: string) => void);
    onRouteChangeError: ?((err: Error & {cancelled: boolean}, url: string) => void);
    push(url: string, as: ?string): Promise<boolean>;
    replace(url: string, as: ?string): Promise<boolean>
  }

  declare export var withRouter: <Props: {}>(component: React.ComponentType<Props>) => React.ComponentType<$Diff<Props, { router: Router }>>;
  declare export default Router;
}

declare module "next/app" {
  declare export var Container: any;
  declare export default any;
}

declare module "next/document" {
  declare export var Head: Head;
  declare export var Main: Class<React$Component<{}>>;
  declare export var NextScript: Class<React$Component<{}>>;
  declare export default Class<React$Component<{}>> & {
    getInitialProps: (ctx: {pathname: string, query: any, req?: http$ClientRequest, res?: http$ServerResponse, jsonPageRes?: any, err?: any, renderPage: (cb: (App: React$Component<{}>) => (props: Object) => any) => void}) => Promise<any>;
  };
}