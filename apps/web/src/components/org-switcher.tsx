'use client';



import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Building2 } from 'lucide-react';

import { useEffect, useRef } from 'react';

import { useActiveOrgId } from '@/hooks/use-active-org';

import { api } from '@/lib/api';

import {

  getActiveOrganizationId,

  setActiveOrganizationId,

} from '@/lib/org-context';

import type { MyOrganization } from '@/lib/types';



export function OrgSwitcher() {

  const queryClient = useQueryClient();

  const activeOrgId = useActiveOrgId();

  const initialized = useRef(false);



  const { data: orgs } = useQuery<MyOrganization[]>({

    queryKey: ['me', 'organizations'],

    queryFn: () => api.get<MyOrganization[]>('/me/organizations'),

  });



  useEffect(() => {

    if (!orgs?.length || initialized.current) return;

    initialized.current = true;



    const stored = getActiveOrganizationId();

    const valid = stored && orgs.some((o) => o.id === stored) ? stored : orgs[0].id;



    if (valid !== stored) {

      setActiveOrganizationId(valid);

    }



    void api.post('/me/active-organization', { organizationId: valid }).catch(() => {

      // sessao ainda a carregar — o switcher manual corrige depois

    });

  }, [orgs]);



  if (!orgs || orgs.length <= 1) return null;



  const selectValue = activeOrgId ?? orgs[0].id;



  async function switchOrg(id: string) {

    if (id === selectValue) return;

    await api.post('/me/active-organization', { organizationId: id });

    setActiveOrganizationId(id);

    queryClient.clear();

  }



  return (

    <div className="border-b p-3">

      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">

        <Building2 className="h-3.5 w-3.5" />

        Organização

      </label>

      <select

        value={selectValue}

        onChange={(e) => void switchOrg(e.target.value)}

        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

      >

        {orgs.map((o) => (

          <option key={o.id} value={o.id}>

            {o.name}

          </option>

        ))}

      </select>

    </div>

  );

}

