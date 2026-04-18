type RouteContext<_T extends string = string> = {
  params: Promise<{ [key: string]: string }>
}
