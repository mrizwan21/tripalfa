import { createLayoutComponent, type LayoutProps } from './create-layout-component';

export type StackProps = LayoutProps;

export const Stack = createLayoutComponent('Stack', 'op-stack');