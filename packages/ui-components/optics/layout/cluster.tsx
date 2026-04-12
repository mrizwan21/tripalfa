import { createLayoutComponent, type LayoutProps } from './create-layout-component';

export type ClusterProps = LayoutProps;

export const Cluster = createLayoutComponent('Cluster', 'op-cluster');