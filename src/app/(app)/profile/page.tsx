'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { RadioOption } from '@/components/ui/RadioOption'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { setUnit, useSessionState } from '@/lib/session-store'

type NotifyPref = 'new-plan' | 'weekly' | 'none'

export default function ProfilePage() {
  const session = useSessionState()
  const [notify, setNotify] = useState<NotifyPref>('new-plan')

  return (
    <div>
      <h1>Profile</h1>
      <div className="grid gap-8 max-w-[560px] mt-5">
        <section>
          <h4 className="mb-3">Account</h4>
          <div className="grid gap-3">
            <Field label="Full name" htmlFor="sn-p-name">
              <Input id="sn-p-name" defaultValue="Jordan Reyes" />
            </Field>
            <Field label="Email" htmlFor="sn-p-email">
              <Input id="sn-p-email" defaultValue="jordan.reyes@example.com" />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3">Coach</h4>
          <p className="m-0">
            <strong>Elena Ruiz</strong> · assigned since Jan 2026
          </p>
          <div className="mt-2">
            <Badge variant="accent">Marathon build · active plan</Badge>
          </div>
        </section>

        <section>
          <h4 className="mb-3">Preferences</h4>
          <Field label="Units" htmlFor="sn-unit">
            <SegmentedControl
              name="unit"
              ariaLabel="Units"
              value={session.unit}
              onChange={(v) => setUnit(v as 'km' | 'mi')}
              options={[
                { value: 'km', label: 'Kilometers' },
                { value: 'mi', label: 'Miles' },
              ]}
            />
          </Field>
          <div className="grid gap-1.5 mt-3">
            <RadioOption name="notify" checked={notify === 'new-plan'} onChange={() => setNotify('new-plan')}>
              Notify me when a new plan is posted
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'weekly'} onChange={() => setNotify('weekly')}>
              Weekly summary only
            </RadioOption>
            <RadioOption name="notify" checked={notify === 'none'} onChange={() => setNotify('none')}>
              No notifications
            </RadioOption>
          </div>
        </section>

        <section>
          <h4 className="mb-3">Integrations</h4>
          <div className="flex gap-2 items-center mb-2">
            <Badge variant="accent">Garmin Connect · Connected</Badge>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="neutral">Strava · Not connected</Badge>
            <Button variant="ghost">Connect</Button>
          </div>
        </section>

        <Button className="w-fit">Save changes</Button>
      </div>
    </div>
  )
}
