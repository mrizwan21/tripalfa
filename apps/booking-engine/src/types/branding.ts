export interface TenantBrandingConfig {
  companyName?: string;
  primaryColor?: string;
  primaryForeground?: string;
  secondaryColor?: string;
  secondaryForeground?: string;
  accentColor?: string;
  accentForeground?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
  buttonRadius?: string;
  inputRadius?: string;
}

export interface BrandingApiResponse {
  data?: TenantBrandingConfig;
}
