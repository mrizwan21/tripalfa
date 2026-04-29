import React from 'react';
import { Layout } from '../Layout';

interface NodalFlowContainerProps {
 children: React.ReactNode;
}

export function NodalFlowContainer({ children }: NodalFlowContainerProps) {
 return (
 <Layout>
 <div className="max-w-[1550px] mx-auto px-6 pb-24 animate-fade-in">
 {children}
 </div>
 </Layout>
 );
}
