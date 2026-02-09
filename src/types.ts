
export interface Driver {
    id: string;
    name: string;
    company: string;
    board: string;
    truckId: string;
    status: 'connected' | 'disconnected' | 'warning';
    dutyStatus: 'Driving' | 'On Duty' | 'Off Duty' | 'Sleeper';
    lastContact: string;
    violations: number;
}

export type Filters = {
    search: string;
    company: string;
    board: string;
    status: Driver['status'] | 'all';
    dutyStatus: Driver['dutyStatus'] | 'all';
};

export const mockDrivers: Driver[] = [
    { id: 'D001', name: 'John Doe', company: 'Alpha Logistics', board: 'Board A', truckId: 'T-101', status: 'connected', dutyStatus: 'Driving', lastContact: 'Just now', violations: 0 },
    { id: 'D002', name: 'Jane Smith', company: 'Bravo Trans', board: 'Board B', truckId: 'T-104', status: 'disconnected', dutyStatus: 'Driving', lastContact: '15m ago', violations: 2 },
    { id: 'D003', name: 'Mike Johnson', company: 'Alpha Logistics', board: 'Board A', truckId: 'T-098', status: 'warning', dutyStatus: 'On Duty', lastContact: '5m ago', violations: 1 },
    { id: 'D004', name: 'Sarah Wilson', company: 'Charlie Freight', board: 'Board C', truckId: 'T-202', status: 'connected', dutyStatus: 'Off Duty', lastContact: '1h ago', violations: 0 },
    { id: 'D005', name: 'Robert Brown', company: 'Bravo Trans', board: 'Board B', truckId: 'T-155', status: 'disconnected', dutyStatus: 'Sleeper', lastContact: '4h ago', violations: 0 },
    { id: 'D006', name: 'Emily Davis', company: 'Alpha Logistics', board: 'Board A', truckId: 'T-303', status: 'connected', dutyStatus: 'Driving', lastContact: '10m ago', violations: 0 },
    { id: 'D007', name: 'David Wilson', company: 'Charlie Freight', board: 'Board C', truckId: 'T-404', status: 'warning', dutyStatus: 'On Duty', lastContact: '30m ago', violations: 3 },
];
