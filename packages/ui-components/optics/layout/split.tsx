import { createLayoutComponent, type LayoutProps } from './create-layout-component';

export type SplitProps = LayoutProps;

export const Split = createLayoutComponent('Split', 'op-split');