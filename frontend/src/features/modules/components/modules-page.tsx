"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/config/permissions";
import { ModulesFeature } from "@/features/modules/components/modules-feature";
import { SubModulesFeature } from "@/features/sub-modules/components/sub-modules-feature";
import { OperationsFeature } from "@/features/operations/components/operations-feature";

export function ModulesPageFeature() {
  const [tab, setTab] = useState("modules");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList variant="line">
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="sub-modules">Sub-modules</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
      </TabsList>
      <TabsContent value="modules" className="pt-4">
        <PermissionGuard permission={PERMISSIONS.modules.view}>
          <ModulesFeature />
        </PermissionGuard>
      </TabsContent>
      <TabsContent value="sub-modules" className="pt-4">
        <PermissionGuard permission={PERMISSIONS.subModules.view}>
          <SubModulesFeature />
        </PermissionGuard>
      </TabsContent>
      <TabsContent value="operations" className="pt-4">
        <PermissionGuard permission={PERMISSIONS.operations.view}>
          <OperationsFeature />
        </PermissionGuard>
      </TabsContent>
    </Tabs>
  );
}