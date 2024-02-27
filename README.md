# Reporting utilizing Nautilus

> This repository uses the [nautilus library](https://github.com/deltaDAO/nautilus) to interact with any Ocean Protocol based data ecosystem.

## How to create a report

Reports are created using one of the available start scripts.

### Audit Trail (Publish)

To create a publish audit trail, run

```sh
npm run start:audit
```

### Consumption Report (Compute-to-Data)

To create a Compute-to-Data consumption report, run

```sh
npm run start:consumption
```

## Configuration

You can configure the publish and compute-to-data parameters, by adjusting the nautilus calls in the `src/audit` and `src/consumption` directories, respectively.
